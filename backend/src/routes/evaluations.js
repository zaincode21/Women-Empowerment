const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.use(authenticate);
router.use((req, res, next) => {
  const action = ['GET', 'HEAD'].includes(req.method) ? 'read' : 'write';
  return requirePermission('evaluations', action)(req, res, next);
});

function normalizeTrainingId(value) {
  if (value === undefined || value === null || value === '') return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.post('/',
  body('participant_id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { participant_id, progress, remarks, achievements, follow_up, next_review_at } = req.body;
    const training_id = normalizeTrainingId(req.body.training_id);
    try {
      const result = await db.query(
        `INSERT INTO evaluations
          (participant_id, training_id, progress, remarks, achievements, follow_up, next_review_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [participant_id, training_id, progress, remarks, achievements || null, follow_up || null, next_review_at || null]
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
    const result = await db.query(
      `SELECT e.*, p.full_name AS participant_name, t.title AS training_title
       FROM evaluations e
       JOIN participants p ON p.id = e.participant_id
       LEFT JOIN trainings t ON t.id = e.training_id
       ORDER BY e.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { progress, remarks, achievements, follow_up, next_review_at } = req.body;
  const training_id = normalizeTrainingId(req.body.training_id);
  try {
    const result = await db.query(
      `UPDATE evaluations
       SET progress=$1, remarks=$2, achievements=$3, follow_up=$4, next_review_at=$5, training_id=$6
       WHERE id=$7 RETURNING *`,
      [progress, remarks, achievements || null, follow_up || null, next_review_at || null, training_id, req.params.id]
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
    const result = await db.query('DELETE FROM evaluations WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/participant/:participantId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, t.title AS training_title
       FROM evaluations e
       LEFT JOIN trainings t ON t.id = e.training_id
       WHERE e.participant_id=$1
       ORDER BY e.created_at DESC`,
      [req.params.participantId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
