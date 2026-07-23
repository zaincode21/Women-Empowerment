const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

async function getAttendanceTimestampColumn() {
  const result = await db.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'attendance'
       AND column_name IN ('created_at', 'recorded_at')
     ORDER BY CASE column_name WHEN 'created_at' THEN 1 ELSE 2 END
     LIMIT 1`
  );

  return result.rows[0]?.column_name || 'id';
}

router.use(authenticate);
router.use((req, res, next) => {
  const action = ['GET', 'HEAD'].includes(req.method) ? 'read' : 'write';
  return requirePermission('attendance', action)(req, res, next);
});

async function ensureEnrollment(trainingId, participantId) {
  await db.query(
    `INSERT INTO training_enrollments (training_id, participant_id)
     VALUES ($1, $2)
     ON CONFLICT (training_id, participant_id) DO NOTHING`,
    [trainingId, participantId]
  );
}

router.post('/',
  body('participant_id').isInt(),
  body('training_id').isInt(),
  body('status').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { participant_id, training_id, status } = req.body;
    try {
      const enrolled = await db.query(
        'SELECT 1 FROM training_enrollments WHERE training_id=$1 AND participant_id=$2',
        [training_id, participant_id]
      );
      if (!enrolled.rows[0]) {
        return res.status(400).json({
          error: 'Participant is not enrolled in this training. Enroll them first.',
        });
      }

      const result = await db.query(
        'INSERT INTO attendance (participant_id, training_id, status) VALUES ($1,$2,$3) RETURNING *',
        [participant_id, training_id, status]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/', async (req, res) => {
  try {
    const timestampColumn = await getAttendanceTimestampColumn();
    const result = await db.query(
      `SELECT a.*, p.full_name as participant_name, t.title as training_title
       FROM attendance a
       JOIN participants p ON p.id = a.participant_id
       JOIN trainings t ON t.id = a.training_id
       ORDER BY a.${timestampColumn} DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    const result = await db.query(
      'UPDATE attendance SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM attendance WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/training/:trainingId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, p.full_name as participant_name
       FROM attendance a
       JOIN participants p ON p.id=a.participant_id
       WHERE a.training_id=$1
       ORDER BY a.id DESC`,
      [req.params.trainingId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/training/:trainingId/participants', async (req, res) => {
  const trainingId = Number(req.params.trainingId);
  if (!Number.isInteger(trainingId)) {
    return res.status(400).json({ error: 'Invalid training id' });
  }
  try {
    const result = await db.query(
      `SELECT p.*, e.enrolled_at
       FROM training_enrollments e
       JOIN participants p ON p.id = e.participant_id
       WHERE e.training_id = $1
       ORDER BY p.full_name ASC`,
      [trainingId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/training/:trainingId/participants',
  body('participant_ids').isArray({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const trainingId = Number(req.params.trainingId);
    const participantIds = (req.body.participant_ids || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));

    if (!Number.isInteger(trainingId) || participantIds.length === 0) {
      return res.status(400).json({ error: 'training id and participant_ids are required' });
    }

    try {
      const training = await db.query('SELECT id FROM trainings WHERE id=$1', [trainingId]);
      if (!training.rows[0]) return res.status(404).json({ error: 'Training not found' });

      for (const participantId of participantIds) {
        await ensureEnrollment(trainingId, participantId);
      }

      const result = await db.query(
        `SELECT p.*, e.enrolled_at
         FROM training_enrollments e
         JOIN participants p ON p.id = e.participant_id
         WHERE e.training_id = $1
         ORDER BY p.full_name ASC`,
        [trainingId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.delete('/training/:trainingId/participants/:participantId', async (req, res) => {
  const trainingId = Number(req.params.trainingId);
  const participantId = Number(req.params.participantId);
  if (!Number.isInteger(trainingId) || !Number.isInteger(participantId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const result = await db.query(
      'DELETE FROM training_enrollments WHERE training_id=$1 AND participant_id=$2 RETURNING id',
      [trainingId, participantId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Enrollment not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/participant/:participantId', async (req, res) => {
  try {
    const result = await db.query('SELECT a.*, t.title FROM attendance a JOIN trainings t ON t.id=a.training_id WHERE a.participant_id=$1', [req.params.participantId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
