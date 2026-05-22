const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.use(authenticate);

router.post('/',
  body('full_name').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { full_name, age, address, phone_number, education_level, occupation } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO participants (full_name, age, address, phone_number, education_level, occupation)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [full_name, age, address, phone_number, education_level, occupation]
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

router.put('/:id', async (req, res) => {
  const { full_name, age, address, phone_number, education_level, occupation } = req.body;
  try {
    const result = await db.query(
      `UPDATE participants SET full_name=$1, age=$2, address=$3, phone_number=$4, education_level=$5, occupation=$6
       WHERE id=$7 RETURNING *`,
      [full_name, age, address, phone_number, education_level, occupation, req.params.id]
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
    await db.query('DELETE FROM participants WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
