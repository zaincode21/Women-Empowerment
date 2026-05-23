const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.post('/', authenticate,
  body('full_name').notEmpty(),
  body('date_of_birth').isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { full_name, address, phone_number, education_level, occupation } = req.body;
    const dateOfBirth = req.body.date_of_birth ? new Date(req.body.date_of_birth) : null;
    const age = dateOfBirth && !Number.isNaN(dateOfBirth.getTime())
      ? Math.max(0, new Date().getFullYear() - dateOfBirth.getFullYear() -
        (new Date().getMonth() > dateOfBirth.getMonth() ||
        (new Date().getMonth() === dateOfBirth.getMonth() && new Date().getDate() >= dateOfBirth.getDate()) ? 0 : 1))
      : null;
    try {
      const result = await db.query(
        `INSERT INTO participants (full_name, age, date_of_birth, village, cell, sector, district, province, address, phone_number, education_level, occupation)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [full_name, age, req.body.date_of_birth, req.body.village, req.body.cell, req.body.sector, req.body.district, req.body.province, address, phone_number, education_level, occupation]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/', async (req, res) => {
  const q = req.query.q;
  try {
    if (q) {
      const result = await db.query('SELECT * FROM participants WHERE full_name ILIKE $1', [`%${q}%`]);
      return res.json(result.rows);
    }
    const result = await db.query('SELECT * FROM participants ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM participants WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { full_name, date_of_birth, village, cell, sector, district, province, address, phone_number, education_level, occupation } = req.body;
  try {
    const result = await db.query(
      `UPDATE participants SET full_name=$1, date_of_birth=$2, village=$3, cell=$4, sector=$5, district=$6, province=$7, address=$8, phone_number=$9, education_level=$10, occupation=$11
       WHERE id=$12 RETURNING *`,
      [full_name, date_of_birth, village, cell, sector, district, province, address, phone_number, education_level, occupation, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM participants WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
