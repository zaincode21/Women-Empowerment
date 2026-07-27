const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticate, requirePermission } = require('../middleware/auth');
const { isValidRole, normalizeRole } = require('../config/roles');
const { createPasswordReset, consumePasswordResetToken } = require('../lib/passwordReset');

const USER_PUBLIC_FIELDS = 'id, username, role, full_name, email, phone_number, created_at';

function publicUser(row) {
  if (!row) return row;
  return {
    id: row.id,
    username: row.username,
    role: normalizeRole(row.role),
    full_name: row.full_name || null,
    email: row.email || null,
    phone_number: row.phone_number || null,
    created_at: row.created_at,
  };
}

router.post('/register',
  body('username').isLength({ min: 3 }),
  body('password').isLength({ min: 6 }),
  body('full_name').trim().isLength({ min: 2 }),
  body('email').isEmail(),
  body('phone_number').optional({ values: 'falsy' }).isLength({ max: 50 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, password } = req.body;
    const full_name = req.body.full_name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const phone_number = req.body.phone_number?.trim() || null;
    let role = normalizeRole(req.body.role || 'staff');
    if (!isValidRole(role) || role === 'participant') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    try {
      const countResult = await db.query('SELECT COUNT(*)::int AS count FROM users');
      const isBootstrap = countResult.rows[0].count === 0;

      if (!isBootstrap) {
        const header = req.headers.authorization;
        if (!header) {
          if (role === 'administrator') {
            return res.status(403).json({ error: 'Administrator accounts must be created by an existing administrator' });
          }
        } else {
          const token = header.split(' ')[1];
          try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            if (payload.role !== 'administrator') {
              return res.status(403).json({ error: 'Only administrators can register users' });
            }
          } catch {
            return res.status(401).json({ error: 'Invalid token' });
          }
        }
      } else {
        role = 'administrator';
      }

      const hashed = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (username, password, role, full_name, email, phone_number)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${USER_PUBLIC_FIELDS}`,
        [username, hashed, role, full_name, email, phone_number]
      );
      res.json(publicUser(result.rows[0]));
    } catch (err) {
      if (err.code === '23505') {
        const detail = String(err.detail || '');
        if (detail.includes('email')) return res.status(400).json({ error: 'Email already exists' });
        return res.status(400).json({ error: 'Username already exists' });
      }
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post('/login',
  body('email').isEmail(),
  body('password').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;
    try {
      // Staff / admin / trainer / PM accounts
      const staffResult = await db.query(
        `SELECT id, username, password, role, full_name, email, phone_number
         FROM users WHERE LOWER(email)=$1`,
        [email]
      );
      const staff = staffResult.rows[0];
      if (staff) {
        const ok = await bcrypt.compare(password, staff.password);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
        const role = normalizeRole(staff.role);
        const token = jwt.sign(
          { id: staff.id, username: staff.username, role, email: staff.email, account_type: 'user' },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '8h' }
        );
        return res.json({ token, user: publicUser(staff) });
      }

      // Participant accounts
      const participantResult = await db.query(
        `SELECT id, full_name, email, phone_number, password, status
         FROM participants
         WHERE LOWER(email)=$1 AND password IS NOT NULL`,
        [email]
      );
      const participant = participantResult.rows[0];
      if (!participant) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, participant.password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      if (participant.status === 'pending') {
        return res.status(403).json({ error: 'Your registration is pending approval. Please wait for staff confirmation.' });
      }
      if (participant.status === 'rejected') {
        return res.status(403).json({ error: 'Your registration was not approved. Contact the program office.' });
      }

      const user = {
        id: participant.id,
        username: participant.email,
        role: 'participant',
        full_name: participant.full_name,
        email: participant.email,
        phone_number: participant.phone_number,
        account_type: 'participant',
        participant_id: participant.id,
        status: participant.status,
      };
      const token = jwt.sign(
        {
          id: participant.id,
          username: participant.email,
          role: 'participant',
          email: participant.email,
          account_type: 'participant',
          participant_id: participant.id,
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '8h' }
      );
      return res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post('/forgot-password',
  body('email').isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const email = req.body.email.trim().toLowerCase();
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    try {
      let account = null;

      const staffResult = await db.query(
        'SELECT id, email FROM users WHERE LOWER(email)=$1',
        [email]
      );
      if (staffResult.rows[0]) {
        account = { type: 'user', id: staffResult.rows[0].id, email: staffResult.rows[0].email };
      } else {
        const participantResult = await db.query(
          'SELECT id, email, status FROM participants WHERE LOWER(email)=$1 AND password IS NOT NULL',
          [email]
        );
        if (participantResult.rows[0]) {
          account = {
            type: 'participant',
            id: participantResult.rows[0].id,
            email: participantResult.rows[0].email,
          };
        }
      }

      // Always return the same message to avoid account enumeration
      const generic = {
        message: 'If an account exists for that email, a password reset link has been created.',
      };

      if (!account) return res.json(generic);

      const { rawToken } = await createPasswordReset({
        accountType: account.type,
        accountId: account.id,
        email: account.email,
      });
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
      console.log(`[password-reset] ${account.email}: ${resetUrl}`);

      return res.json({
        ...generic,
        // Returned for local/demo use when SMTP is not configured
        resetUrl: process.env.NODE_ENV === 'production' && !process.env.SHOW_RESET_URL ? undefined : resetUrl,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post('/reset-password',
  body('token').isLength({ min: 20 }),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const record = await consumePasswordResetToken(req.body.token);
      if (!record) {
        return res.status(400).json({ error: 'Invalid or expired reset link' });
      }

      const hashed = await bcrypt.hash(req.body.password, 10);
      if (record.account_type === 'user') {
        await db.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, record.account_id]);
      } else if (record.account_type === 'participant') {
        await db.query('UPDATE participants SET password=$1 WHERE id=$2', [hashed, record.account_id]);
      } else {
        return res.status(400).json({ error: 'Invalid reset token' });
      }

      res.json({ message: 'Password updated successfully. You can sign in now.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/users', authenticate, requirePermission('users', 'read'), async (req, res) => {
  try {
    const result = await db.query(`SELECT ${USER_PUBLIC_FIELDS} FROM users ORDER BY id`);
    res.json(result.rows.map(publicUser));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function countAdministrators() {
  const result = await db.query("SELECT COUNT(*)::int AS count FROM users WHERE role='administrator'");
  return result.rows[0].count;
}

router.put('/users/:id',
  authenticate,
  requirePermission('users', 'write'),
  body('username').isLength({ min: 3 }),
  body('full_name').optional({ values: 'falsy' }).trim().isLength({ min: 2 }),
  body('email').isEmail(),
  body('phone_number').optional({ values: 'falsy' }).isLength({ max: 50 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username } = req.body;
    const full_name = req.body.full_name !== undefined ? (req.body.full_name?.trim() || null) : undefined;
    const email = req.body.email?.trim().toLowerCase();
    const phone_number = req.body.phone_number !== undefined ? (req.body.phone_number?.trim() || null) : undefined;
    const role = req.body.role !== undefined ? normalizeRole(req.body.role) : undefined;
    if (role !== undefined && !isValidRole(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    try {
      const existing = await db.query('SELECT id, role FROM users WHERE id=$1', [req.params.id]);
      const user = existing.rows[0];
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (user.role === 'administrator' && role && role !== 'administrator') {
        const adminCount = await countAdministrators();
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot change role of the last administrator' });
        }
      }

      const result = await db.query(
        `UPDATE users
         SET username=$1,
             role=COALESCE($2, role),
             full_name=$3,
             email=$4,
             phone_number=$5
         WHERE id=$6
         RETURNING ${USER_PUBLIC_FIELDS}`,
        [
          username,
          role || null,
          full_name !== undefined ? full_name : null,
          email || null,
          phone_number !== undefined ? phone_number : null,
          req.params.id,
        ]
      );
      res.json(publicUser(result.rows[0]));
    } catch (err) {
      if (err.code === '23505') {
        const detail = String(err.detail || '');
        if (detail.includes('email')) return res.status(400).json({ error: 'Email already exists' });
        return res.status(400).json({ error: 'Username already exists' });
      }
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.put('/users/:id/password',
  authenticate,
  requirePermission('users', 'write'),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const existing = await db.query('SELECT id FROM users WHERE id=$1', [req.params.id]);
      if (!existing.rows[0]) return res.status(404).json({ error: 'User not found' });

      const hashed = await bcrypt.hash(req.body.password, 10);
      await db.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.delete('/users/:id', authenticate, requirePermission('users', 'write'), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existing = await db.query('SELECT id, role FROM users WHERE id=$1', [userId]);
    const user = existing.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'administrator') {
      const adminCount = await countAdministrators();
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last administrator' });
      }
    }

    await db.query('DELETE FROM users WHERE id=$1', [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
