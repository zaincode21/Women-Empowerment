const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

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

router.post('/', authenticate,
  body('full_name').notEmpty(),
  body('age').optional({ nullable: true }).isInt({ min: 0 }),
  body('date_of_birth').optional({ nullable: true }).isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { full_name, address, phone_number, education_level, occupation } = req.body;
    const age = req.body.age !== undefined && req.body.age !== '' ? Number(req.body.age) : calculateAge(req.body.date_of_birth);
    const dateOfBirth = req.body.date_of_birth || null;
    try {
      const result = await db.query(
        `INSERT INTO participants (full_name, age, date_of_birth, village, cell, sector, district, province, address, phone_number, education_level, occupation)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [full_name, age, dateOfBirth, req.body.village, req.body.cell, req.body.sector, req.body.district, req.body.province, address, phone_number, education_level, occupation]
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
  const { full_name, village, cell, sector, district, province, address, phone_number, education_level, occupation } = req.body;
  const age = req.body.age !== undefined && req.body.age !== '' ? Number(req.body.age) : calculateAge(req.body.date_of_birth);
  const dateOfBirth = req.body.date_of_birth || null;
  try {
    const result = await db.query(
      `UPDATE participants SET full_name=$1, age=$2, date_of_birth=$3, village=$4, cell=$5, sector=$6, district=$7, province=$8, address=$9, phone_number=$10, education_level=$11, occupation=$12
       WHERE id=$13 RETURNING *`,
      [full_name, age, dateOfBirth, village, cell, sector, district, province, address, phone_number, education_level, occupation, req.params.id]
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
