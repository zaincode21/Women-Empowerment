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
const monitoringRoutes = require('./routes/monitoring');
const reportsRoutes = require('./routes/reports');
const meRoutes = require('./routes/me');
const db = require('./db');
const { loadDashboardAnalytics } = require('./lib/analytics');
const { authenticate, requirePermission } = require('./middleware/auth');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/summary', authenticate, requirePermission('dashboard', 'read'), async (req, res, next) => {
  try {
    const countsResult = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM participants) AS participants,
        (SELECT COUNT(*)::int FROM trainings) AS trainings,
        (SELECT COUNT(*)::int FROM attendance) AS attendance,
        (SELECT COUNT(*)::int FROM evaluations) AS evaluations
    `);

    const nextTrainingResult = await db.query(`
      SELECT json_build_object(
        'id', id,
        'title', title,
        'start_date', start_date,
        'end_date', end_date,
        'date', start_date,
        'location', location
      ) AS nextTraining
      FROM trainings
      WHERE start_date IS NOT NULL AND start_date >= NOW()
      ORDER BY start_date ASC
      LIMIT 1
    `);

    const trendsResult = await db.query(`
      WITH month_series AS (
        SELECT generate_series(date_trunc('month', NOW()) - interval '5 months', date_trunc('month', NOW()), interval '1 month') AS month_start
      ),
      participant_months AS (
        SELECT date_trunc('month', created_at) AS month_start, COUNT(*)::int AS count
        FROM participants
        GROUP BY 1
      ),
      training_months AS (
        SELECT date_trunc('month', created_at) AS month_start, COUNT(*)::int AS count
        FROM trainings
        GROUP BY 1
      ),
      attendance_months AS (
        SELECT date_trunc('month', created_at) AS month_start, COUNT(*)::int AS count
        FROM attendance
        GROUP BY 1
      ),
      evaluation_months AS (
        SELECT date_trunc('month', created_at) AS month_start, COUNT(*)::int AS count
        FROM evaluations
        GROUP BY 1
      )
      SELECT
        to_char(ms.month_start, 'Mon YYYY') AS month,
        COALESCE(pm.count, 0)::int AS participants,
        COALESCE(tm.count, 0)::int AS trainings,
        COALESCE(am.count, 0)::int AS attendance,
        COALESCE(em.count, 0)::int AS evaluations
      FROM month_series ms
      LEFT JOIN participant_months pm USING (month_start)
      LEFT JOIN training_months tm USING (month_start)
      LEFT JOIN attendance_months am USING (month_start)
      LEFT JOIN evaluation_months em USING (month_start)
      ORDER BY ms.month_start
    `);

    const recentResult = await db.query(`
      SELECT title, action, meta, created_at FROM (
        SELECT full_name AS title, 'Participant registered' AS action, COALESCE(village, '') AS meta, created_at
        FROM participants
        UNION ALL
        SELECT title, 'Training created' AS action, COALESCE(location, '') AS meta, created_at
        FROM trainings
        UNION ALL
        SELECT p.full_name || ' — ' || t.title AS title, 'Attendance recorded' AS action, a.status AS meta, a.created_at
        FROM attendance a
        JOIN participants p ON p.id = a.participant_id
        JOIN trainings t ON t.id = a.training_id
        UNION ALL
        SELECT p.full_name AS title, 'Evaluation recorded' AS action, COALESCE(e.progress, '') AS meta, e.created_at
        FROM evaluations e
        JOIN participants p ON p.id = e.participant_id
      ) AS activity
      ORDER BY created_at DESC
      LIMIT 8
    `);

    const analytics = await loadDashboardAnalytics(db);

    res.json({
      ...(countsResult.rows[0] || { participants: 0, trainings: 0, attendance: 0, evaluations: 0 }),
      nextTraining: nextTrainingResult.rows[0]?.nextTraining || null,
      trends: trendsResult.rows || [],
      recent: recentResult.rows || [],
      ...analytics,
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
