const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.post('/', authenticate,
  body('participant_id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { participant_id, progress, remarks } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO evaluations (participant_id, progress, remarks) VALUES ($1,$2,$3) RETURNING *',
        [participant_id, progress, remarks]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/participant/:participantId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM evaluations WHERE participant_id=$1 ORDER BY created_at DESC', [req.params.participantId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
