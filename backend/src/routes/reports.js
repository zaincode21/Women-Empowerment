const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  generateWeeklySnapshot,
  generateMonthlySnapshot,
} = require('../lib/reportGenerator');

const ATTENDED_STATUSES = ['Present', 'Late'];

router.use(authenticate);
router.use((req, res, next) => {
  const action = ['GET', 'HEAD'].includes(req.method) ? 'read' : 'write';
  return requirePermission('reports', action)(req, res, next);
});

function buildDateFilters(query, column, params) {
  const clauses = [];
  if (query.from) {
    params.push(query.from);
    clauses.push(`${column} >= $${params.length}::date`);
  }
  if (query.to) {
    params.push(query.to);
    clauses.push(`${column} < ($${params.length}::date + interval '1 day')`);
  }
  return clauses;
}

router.get('/attendance', async (req, res) => {
  try {
    const params = [];
    const clauses = [];

    if (req.query.training_id) {
      params.push(Number(req.query.training_id));
      clauses.push(`a.training_id = $${params.length}`);
    }
    if (req.query.participant_id) {
      params.push(Number(req.query.participant_id));
      clauses.push(`a.participant_id = $${params.length}`);
    }
    clauses.push(...buildDateFilters(req.query, 'a.created_at', params));

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rowsResult = await db.query(
      `SELECT
        a.id,
        a.participant_id,
        p.full_name AS participant_name,
        a.training_id,
        t.title AS training_title,
        a.status,
        a.created_at
      FROM attendance a
      JOIN participants p ON p.id = a.participant_id
      JOIN trainings t ON t.id = a.training_id
      ${where}
      ORDER BY a.created_at DESC`,
      params
    );

    const summaryResult = await db.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE a.status = ANY($${params.length + 1}::text[]))::int AS attended,
        COUNT(*) FILTER (WHERE a.status = 'Absent')::int AS absent,
        COUNT(*) FILTER (WHERE a.status = 'Late')::int AS late
      FROM attendance a
      ${where}`,
      [...params, ATTENDED_STATUSES]
    );

    const summary = summaryResult.rows[0] || { total: 0, attended: 0, absent: 0, late: 0 };
    const total = summary.total || 0;
    const attended = summary.attended || 0;

    res.json({
      summary: {
        ...summary,
        rate: total === 0 ? 0 : Math.round((attended / total) * 100),
      },
      rows: rowsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/trainings', async (req, res) => {
  try {
    const params = [];
    const clauses = [];

    if (req.query.trainer_id) {
      params.push(Number(req.query.trainer_id));
      clauses.push(`t.trainer_id = $${params.length}`);
    }
    clauses.push(...buildDateFilters(req.query, 'COALESCE(t.start_date, t.date::timestamp, t.created_at)', params));

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rowsResult = await db.query(
      `SELECT
        t.id,
        t.title,
        t.trainer_name,
        t.trainer_id,
        COALESCE(t.start_date::date, t.date) AS date,
        t.location,
        t.description,
        t.created_at,
        COUNT(a.id)::int AS attendance_count
      FROM trainings t
      LEFT JOIN attendance a ON a.training_id = t.id
      ${where}
      GROUP BY t.id
      ORDER BY COALESCE(t.start_date, t.date::timestamp, t.created_at) DESC`,
      params
    );

    const summaryResult = await db.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.trainer_id IS NOT NULL OR t.trainer_name IS NOT NULL AND t.trainer_name <> '')::int AS with_trainer
      FROM trainings t
      ${where}`,
      params
    );

    res.json({
      summary: summaryResult.rows[0] || { total: 0, with_trainer: 0 },
      rows: rowsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const participantId = req.query.participant_id ? Number(req.query.participant_id) : null;
    const params = participantId ? [participantId, ATTENDED_STATUSES] : [ATTENDED_STATUSES];
    const participantFilter = participantId ? 'WHERE p.id = $1' : '';

    const rowsResult = await db.query(
      `SELECT
        p.id AS participant_id,
        p.full_name AS participant_name,
        COALESCE(att.total_records, 0)::int AS attendance_total,
        COALESCE(att.attended_records, 0)::int AS attendance_attended,
        CASE
          WHEN COALESCE(att.total_records, 0) = 0 THEN 0
          ELSE ROUND((att.attended_records::numeric / att.total_records) * 100)::int
        END AS attendance_rate,
        le.progress AS latest_progress,
        le.training_title AS latest_training_title,
        le.created_at AS last_evaluation_at,
        COALESCE(ev.evaluation_count, 0)::int AS evaluation_count
      FROM participants p
      LEFT JOIN (
        SELECT
          participant_id,
          COUNT(*)::int AS total_records,
          COUNT(*) FILTER (WHERE status = ANY($${participantId ? 2 : 1}::text[]))::int AS attended_records
        FROM attendance
        GROUP BY participant_id
      ) att ON att.participant_id = p.id
      LEFT JOIN LATERAL (
        SELECT e.progress, e.created_at, t.title AS training_title
        FROM evaluations e
        LEFT JOIN trainings t ON t.id = e.training_id
        WHERE e.participant_id = p.id
        ORDER BY e.created_at DESC
        LIMIT 1
      ) le ON true
      LEFT JOIN (
        SELECT participant_id, COUNT(*)::int AS evaluation_count
        FROM evaluations
        GROUP BY participant_id
      ) ev ON ev.participant_id = p.id
      ${participantFilter}
      ORDER BY p.full_name`,
      params
    );

    const summary = {
      participants: rowsResult.rows.length,
      averageAttendanceRate: rowsResult.rows.length
        ? Math.round(rowsResult.rows.reduce((sum, row) => sum + (row.attendance_rate || 0), 0) / rowsResult.rows.length)
        : 0,
      withEvaluations: rowsResult.rows.filter((row) => row.evaluation_count > 0).length,
    };

    res.json({ summary, rows: rowsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/evaluations', async (req, res) => {
  try {
    const params = [];
    const clauses = [];

    if (req.query.participant_id) {
      params.push(Number(req.query.participant_id));
      clauses.push(`e.participant_id = $${params.length}`);
    }
    if (req.query.training_id) {
      params.push(Number(req.query.training_id));
      clauses.push(`e.training_id = $${params.length}`);
    }
    clauses.push(...buildDateFilters(req.query, 'e.created_at', params));

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rowsResult = await db.query(
      `SELECT
        e.id,
        e.participant_id,
        p.full_name AS participant_name,
        e.training_id,
        t.title AS training_title,
        e.progress,
        e.remarks,
        e.achievements,
        e.follow_up,
        e.next_review_at,
        e.created_at
      FROM evaluations e
      JOIN participants p ON p.id = e.participant_id
      LEFT JOIN trainings t ON t.id = e.training_id
      ${where}
      ORDER BY e.created_at DESC`,
      params
    );

    const summaryResult = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM evaluations e
       ${where}`,
      params
    );

    res.json({
      summary: summaryResult.rows[0] || { total: 0 },
      rows: rowsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/snapshots', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await db.query(
      `SELECT id, period_type, period_label, period_start, period_end, trigger_source, created_at
       FROM report_snapshots
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/snapshots/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, period_type, period_label, period_start, period_end, trigger_source, summary, created_at
       FROM report_snapshots
       WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/snapshots/generate', async (req, res) => {
  try {
    const periodType = String(req.body.period_type || 'weekly').toLowerCase();
    const snap = periodType === 'monthly'
      ? await generateMonthlySnapshot('manual')
      : await generateWeeklySnapshot('manual');
    res.status(201).json(snap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
