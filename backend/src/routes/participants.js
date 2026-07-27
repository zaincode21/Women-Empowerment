const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { authenticate, requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

function omitPassword(row) {
  if (!row) return row;
  const { password, ...safe } = row;
  return safe;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return Math.max(0, age);
}

function normalizeTrainingIds(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

async function syncParticipantEnrollments(participantId, trainingIds) {
  const ids = normalizeTrainingIds(trainingIds);
  await db.query('DELETE FROM training_enrollments WHERE participant_id=$1', [participantId]);
  for (const trainingId of ids) {
    await db.query(
      `INSERT INTO training_enrollments (training_id, participant_id)
       VALUES ($1, $2)
       ON CONFLICT (training_id, participant_id) DO NOTHING`,
      [trainingId, participantId]
    );
  }
  return ids;
}

async function insertParticipant(reqBody, { status = 'pending' } = {}) {
  const { full_name, address, phone_number, education_level, occupation, password } = reqBody;
  const email = reqBody.email?.trim().toLowerCase();
  if (!email) throw Object.assign(new Error('Email is required'), { status: 400 });
  const age = reqBody.age !== undefined && reqBody.age !== '' ? Number(reqBody.age) : calculateAge(reqBody.date_of_birth);
  const dateOfBirth = reqBody.date_of_birth || null;
  const hashed = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO participants (full_name, age, date_of_birth, village, cell, sector, district, province, address, phone_number, email, education_level, occupation, password, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [full_name, age, dateOfBirth, reqBody.village, reqBody.cell, reqBody.sector, reqBody.district, reqBody.province, address, phone_number, email, education_level, occupation, hashed, status]
  );
  return result.rows[0];
}

const participantValidators = [
  body('full_name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('age').optional({ nullable: true }).isInt({ min: 0 }),
  body('date_of_birth').optional({ nullable: true }).isISO8601(),
  body('training_ids').isArray({ min: 1 }),
];

router.post('/register', participantValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const trainingIds = normalizeTrainingIds(req.body.training_ids);
  if (trainingIds.length === 0) {
    return res.status(400).json({ error: 'Select at least one training' });
  }

  try {
    const participant = await insertParticipant(req.body, { status: 'pending' });
    await syncParticipantEnrollments(participant.id, trainingIds);
    const enrollments = await db.query(
      `SELECT t.id, t.title, t.date, t.start_date, t.location
       FROM training_enrollments e
       JOIN trainings t ON t.id = e.training_id
       WHERE e.participant_id = $1
       ORDER BY t.title`,
      [participant.id]
    );
    res.status(201).json({
      ...omitPassword(participant),
      trainings: enrollments.rows,
      message: 'Registration submitted. An administrator must approve your account before you can sign in.',
    });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.use(authenticate);
router.use((req, res, next) => {
  const action = ['GET', 'HEAD'].includes(req.method) ? 'read' : 'write';
  return requirePermission('participants', action)(req, res, next);
});

router.post('/', participantValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const trainingIds = normalizeTrainingIds(req.body.training_ids);
  if (trainingIds.length === 0) {
    return res.status(400).json({ error: 'Select at least one training' });
  }

  try {
    const participant = await insertParticipant(req.body, { status: 'approved' });
    await syncParticipantEnrollments(participant.id, trainingIds);
    const enrollments = await db.query(
      `SELECT t.id, t.title FROM training_enrollments e JOIN trainings t ON t.id = e.training_id WHERE e.participant_id = $1`,
      [participant.id]
    );
    res.json({ ...omitPassword(participant), trainings: enrollments.rows });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PARTICIPANT_PUBLIC_FIELDS = `id, full_name, age, date_of_birth, village, cell, sector, district, province, address, phone_number, email, education_level, occupation, status, created_at`;

router.get('/', async (req, res) => {
  const q = req.query.q;
  const status = req.query.status;
  try {
    const clauses = [];
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      clauses.push(`full_name ILIKE $${params.length}`);
    }
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await db.query(
      `SELECT ${PARTICIPANT_PUBLIC_FIELDS} FROM participants ${where} ORDER BY id DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/status',
  body('status').isIn(['pending', 'approved', 'rejected']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const result = await db.query(
        `UPDATE participants SET status=$1 WHERE id=$2 RETURNING ${PARTICIPANT_PUBLIC_FIELDS}`,
        [req.body.status, req.params.id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/:id/trainings', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.id, t.title, t.date, t.start_date, t.location, e.enrolled_at
       FROM training_enrollments e
       JOIN trainings t ON t.id = e.training_id
       WHERE e.participant_id = $1
       ORDER BY t.title`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ${PARTICIPANT_PUBLIC_FIELDS} FROM participants WHERE id=$1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { full_name, village, cell, sector, district, province, address, phone_number, education_level, occupation } = req.body;
  const email = req.body.email?.trim().toLowerCase() || null;
  const age = req.body.age !== undefined && req.body.age !== '' ? Number(req.body.age) : calculateAge(req.body.date_of_birth);
  const dateOfBirth = req.body.date_of_birth || null;
  const trainingIds = req.body.training_ids !== undefined ? normalizeTrainingIds(req.body.training_ids) : null;

  if (trainingIds !== null && trainingIds.length === 0) {
    return res.status(400).json({ error: 'Select at least one training' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await db.query(
      `UPDATE participants SET full_name=$1, age=$2, date_of_birth=$3, village=$4, cell=$5, sector=$6, district=$7, province=$8, address=$9, phone_number=$10, email=$11, education_level=$12, occupation=$13
       WHERE id=$14 RETURNING *`,
      [full_name, age, dateOfBirth, village, cell, sector, district, province, address, phone_number, email, education_level, occupation, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });

    if (trainingIds !== null) {
      await syncParticipantEnrollments(result.rows[0].id, trainingIds);
    }

    const enrollments = await db.query(
      `SELECT t.id, t.title FROM training_enrollments e JOIN trainings t ON t.id = e.training_id WHERE e.participant_id = $1`,
      [result.rows[0].id]
    );
    res.json({ ...omitPassword(result.rows[0]), trainings: enrollments.rows });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM participants WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
