const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

function normalizeTrainer(req) {
  return {
    full_name: req.body.full_name ?? req.body.name,
    phone_number: req.body.phone_number ?? req.body.phone,
    email: req.body.email,
    specialization: req.body.specialization,
    village: req.body.village,
    cell: req.body.cell,
    sector: req.body.sector,
    district: req.body.district,
    province: req.body.province,
    bio: req.body.bio,
  };
}

function mapTrainer(row) {
  return {
    ...row,
    full_name: row.full_name ?? row.name,
    phone_number: row.phone_number ?? row.phone,
    name: row.name ?? row.full_name,
    phone: row.phone ?? row.phone_number,
  };
}

router.post('/', authenticate, body('full_name').custom((value, { req }) => Boolean(value || req.body.name)), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { full_name, phone_number, email, specialization, village, cell, sector, district, province, bio } = normalizeTrainer(req);
  try {
    const result = await db.query(
      `INSERT INTO trainers (full_name, phone_number, name, phone, email, specialization, village, cell, sector, district, province, bio) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [full_name, phone_number, full_name, phone_number, email, specialization, village, cell, sector, district, province, bio]
    );
    res.json(mapTrainer(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM trainers ORDER BY id DESC');
    const mapped = result.rows.map(mapTrainer);
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM trainers WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(mapTrainer(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { full_name, phone_number, email, specialization, village, cell, sector, district, province, bio } = normalizeTrainer(req);
  try {
    const result = await db.query(
      `UPDATE trainers SET full_name=$1, phone_number=$2, name=$3, phone=$4, email=$5, specialization=$6, village=$7, cell=$8, sector=$9, district=$10, province=$11, bio=$12 WHERE id=$13 RETURNING *`,
      [full_name, phone_number, full_name, phone_number, email, specialization, village, cell, sector, district, province, bio, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(mapTrainer(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM trainers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
