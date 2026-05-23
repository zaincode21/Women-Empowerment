const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.post('/', authenticate, body('title').notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  let { title, trainer_id, start_date, end_date, village, cell, sector, district, province, location, description } = req.body;
  try {
    // compute trainer_name from trainer_id if present, else fall back to provided trainer_name or title
    let trainer_name = req.body.trainer_name || '';
    if (trainer_id) {
      const tRes = await db.query('SELECT full_name FROM trainers WHERE id=$1', [trainer_id]);
      if (tRes.rows[0]) trainer_name = tRes.rows[0].full_name;
    }

    // ensure non-nullable fields have values
    const date = start_date ? (new Date(start_date)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    location = location || '';
    description = description || '';

    const result = await db.query(
      `INSERT INTO trainings (title, trainer_name, date, location, description, trainer_id, start_date, end_date, village, cell, sector, district, province)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [title, trainer_name, date, location, description, trainer_id || null, start_date || null, end_date || null, village || null, cell || null, sector || null, district || null, province || null]
    );
    const training = result.rows[0];
    const joined = await db.query('SELECT t.*, tr.full_name as trainer_name FROM trainings t LEFT JOIN trainers tr ON t.trainer_id=tr.id WHERE t.id=$1', [training.id]);
    res.json(joined.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT t.*, tr.full_name as trainer_name FROM trainings t LEFT JOIN trainers tr ON t.trainer_id=tr.id ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT t.*, tr.full_name as trainer_name FROM trainings t LEFT JOIN trainers tr ON t.trainer_id=tr.id WHERE t.id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  let { title, trainer_id, start_date, end_date, village, cell, sector, district, province, location, description } = req.body;
  try {
    let trainer_name = req.body.trainer_name || '';
    if (trainer_id) {
      const tRes = await db.query('SELECT full_name FROM trainers WHERE id=$1', [trainer_id]);
      if (tRes.rows[0]) trainer_name = tRes.rows[0].full_name;
    }
    const date = start_date ? (new Date(start_date)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    location = location || '';
    description = description || '';

    const result = await db.query(
      `UPDATE trainings SET title=$1, trainer_name=$2, date=$3, location=$4, description=$5, trainer_id=$6, start_date=$7, end_date=$8, village=$9, cell=$10, sector=$11, district=$12, province=$13 WHERE id=$14 RETURNING *`,
      [title, trainer_name, date, location, description, trainer_id || null, start_date || null, end_date || null, village || null, cell || null, sector || null, district || null, province || null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const joined = await db.query('SELECT t.*, tr.full_name as trainer_name FROM trainings t LEFT JOIN trainers tr ON t.trainer_id=tr.id WHERE t.id=$1', [req.params.id]);
    res.json(joined.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM trainings WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
