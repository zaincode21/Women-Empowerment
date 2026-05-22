const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.use(authenticate);

router.post('/',
  body('participant_id').isInt(),
  body('training_id').isInt(),
  body('status').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { participant_id, training_id, status } = req.body;
    try {
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

router.get('/training/:trainingId', async (req, res) => {
  try {
    const result = await db.query('SELECT a.*, p.full_name FROM attendance a JOIN participants p ON p.id=a.participant_id WHERE a.training_id=$1', [req.params.trainingId]);
    res.json(result.rows);
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
