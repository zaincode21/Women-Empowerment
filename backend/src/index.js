require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

const authRoutes = require('./routes/auth');
const participantsRoutes = require('./routes/participants');
const trainingsRoutes = require('./routes/trainings');
const trainersRoutes = require('./routes/trainers');
const attendanceRoutes = require('./routes/attendance');
const evaluationsRoutes = require('./routes/evaluations');
const db = require('./db');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/evaluations', evaluationsRoutes);

app.get('/api/summary', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM participants) AS participants,
        (SELECT COUNT(*)::int FROM trainings) AS trainings,
        (SELECT COUNT(*)::int FROM attendance) AS attendance,
        (SELECT COUNT(*)::int FROM evaluations) AS evaluations,
        (
          SELECT json_build_object(
            'id', id,
            'title', title,
            'start_date', start_date,
            'end_date', end_date
          )
          FROM trainings
          WHERE start_date IS NOT NULL AND start_date >= NOW()
          ORDER BY start_date ASC
          LIMIT 1
        ) AS "nextTraining"
    `);

    res.json(result.rows[0] || {
      participants: 0,
      trainings: 0,
      attendance: 0,
      evaluations: 0,
      nextTraining: null,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (req, res) => res.json({status: 'ok'}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
