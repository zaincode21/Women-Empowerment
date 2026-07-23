const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticate, requirePermission } = require('../middleware/auth');
const { isValidRole, normalizeRole } = require('../config/roles');

router.post('/register',
  body('username').isLength({ min: 3 }),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, password } = req.body;
    let role = normalizeRole(req.body.role || 'staff');
    if (!isValidRole(role)) return res.status(400).json({ error: 'Invalid role' });

    try {
      const countResult = await db.query('SELECT COUNT(*)::int AS count FROM users');
      const isBootstrap = countResult.rows[0].count === 0;

      if (!isBootstrap) {
        const header = req.headers.authorization;
        if (!header) return res.status(401).json({ error: 'Administrator authentication required' });
        const token = header.split(' ')[1];
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
          if (payload.role !== 'administrator') {
            return res.status(403).json({ error: 'Only administrators can register users' });
          }
        } catch {
          return res.status(401).json({ error: 'Invalid token' });
        }
        if (role === 'administrator' && req.body.role) {
          // only admins can assign administrator role (already verified above)
        }
      } else {
        role = 'administrator';
      }

      const hashed = await bcrypt.hash(password, 10);
      const result = await db.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
        [username, hashed, role]
      );
      res.json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(400).json({ error: 'Username already exists' });
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post('/login',
  body('username').exists(),
  body('password').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, password } = req.body;
    try {
      const result = await db.query('SELECT id, username, password, role FROM users WHERE username=$1', [username]);
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, username: user.username, role: normalizeRole(user.role) }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
      res.json({ token, user: { id: user.id, username: user.username, role: normalizeRole(user.role) } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/users', authenticate, requirePermission('users', 'read'), async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, role, created_at FROM users ORDER BY id');
    res.json(result.rows);
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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username } = req.body;
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
        `UPDATE users SET username=$1, role=COALESCE($2, role) WHERE id=$3 RETURNING id, username, role, created_at`,
        [username, role || null, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(400).json({ error: 'Username already exists' });
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
