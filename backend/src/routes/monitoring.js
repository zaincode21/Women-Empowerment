const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');

const ATTENDED_STATUSES = ['Present', 'Late'];

router.use(authenticate);
router.use((req, res, next) => {
  const action = ['GET', 'HEAD'].includes(req.method) ? 'read' : 'write';
  return requirePermission('monitoring', action)(req, res, next);
});

router.get('/activities', async (req, res) => {
  const participantId = req.query.participant_id ? Number(req.query.participant_id) : null;
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  try {
    const params = [];
    let participantFilter = '';

    if (participantId) {
      params.push(participantId);
      participantFilter = `WHERE participant_id = $${params.length}`;
    }

    params.push(limit);
    const limitParam = `$${params.length}`;

    const result = await db.query(
      `SELECT title, action, meta, created_at, participant_id FROM (
        SELECT p.id AS participant_id, p.full_name AS title, 'Participant registered' AS action,
               COALESCE(p.village, '') AS meta, p.created_at
        FROM participants p
        UNION ALL
        SELECT a.participant_id, p.full_name || ' — ' || t.title AS title, 'Attendance recorded' AS action,
               a.status AS meta, a.created_at
        FROM attendance a
        JOIN participants p ON p.id = a.participant_id
        JOIN trainings t ON t.id = a.training_id
        UNION ALL
        SELECT e.participant_id, p.full_name AS title, 'Evaluation recorded' AS action,
               COALESCE(e.progress, '') AS meta, e.created_at
        FROM evaluations e
        JOIN participants p ON p.id = e.participant_id
      ) AS activity
      ${participantFilter}
      ORDER BY created_at DESC
      LIMIT ${limitParam}`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/participants', async (req, res) => {
  const q = req.query.q;
  try {
    const params = [];
    let where = '';

    if (q) {
      params.push(`%${q}%`);
      where = `WHERE p.full_name ILIKE $${params.length}`;
    }

    const result = await db.query(
      `SELECT
        p.id,
        p.full_name,
        p.age,
        p.village,
        p.phone_number,
        p.education_level,
        p.occupation,
        p.created_at,
        COALESCE(att.total_records, 0)::int AS attendance_total,
        COALESCE(att.attended_records, 0)::int AS attendance_attended,
        CASE
          WHEN COALESCE(att.total_records, 0) = 0 THEN 0
          ELSE ROUND((att.attended_records::numeric / att.total_records) * 100)::int
        END AS attendance_rate,
        le.progress AS latest_progress,
        le.created_at AS last_evaluation_at,
        (
          SELECT MAX(ts) FROM (
            SELECT p.created_at AS ts
            UNION ALL SELECT att.last_at
            UNION ALL SELECT le.created_at
          ) AS dates(ts)
        ) AS last_activity_at
      FROM participants p
      LEFT JOIN (
        SELECT
          participant_id,
          COUNT(*)::int AS total_records,
          COUNT(*) FILTER (WHERE status = ANY($${params.length + 1}::text[]))::int AS attended_records,
          MAX(created_at) AS last_at
        FROM attendance
        GROUP BY participant_id
      ) att ON att.participant_id = p.id
      LEFT JOIN LATERAL (
        SELECT progress, created_at
        FROM evaluations e
        WHERE e.participant_id = p.id
        ORDER BY created_at DESC
        LIMIT 1
      ) le ON true
      ${where}
      ORDER BY p.full_name`,
      [...params, ATTENDED_STATUSES]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/participants/:id', async (req, res) => {
  const participantId = Number(req.params.id);
  if (!Number.isInteger(participantId)) {
    return res.status(400).json({ error: 'Invalid participant id' });
  }

  try {
    const participantResult = await db.query('SELECT * FROM participants WHERE id=$1', [participantId]);
    const participant = participantResult.rows[0];
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const attendanceSummaryResult = await db.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = ANY($2::text[]))::int AS attended
      FROM attendance
      WHERE participant_id = $1`,
      [participantId, ATTENDED_STATUSES]
    );

    const byTrainingResult = await db.query(
      `SELECT
        t.id AS training_id,
        t.title AS training_title,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE a.status = ANY($2::text[]))::int AS attended,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND((COUNT(*) FILTER (WHERE a.status = ANY($2::text[]))::numeric / COUNT(*)) * 100)::int
        END AS rate
      FROM attendance a
      JOIN trainings t ON t.id = a.training_id
      WHERE a.participant_id = $1
      GROUP BY t.id, t.title
      ORDER BY t.title`,
      [participantId, ATTENDED_STATUSES]
    );

    const attendanceRecordsResult = await db.query(
      `SELECT a.*, t.title AS training_title
       FROM attendance a
       JOIN trainings t ON t.id = a.training_id
       WHERE a.participant_id = $1
       ORDER BY a.created_at DESC`,
      [participantId]
    );

    const evaluationsResult = await db.query(
      `SELECT * FROM evaluations WHERE participant_id = $1 ORDER BY created_at DESC`,
      [participantId]
    );

    const activitiesResult = await db.query(
      `SELECT title, action, meta, created_at FROM (
        SELECT full_name AS title, 'Participant registered' AS action, COALESCE(village, '') AS meta, created_at
        FROM participants WHERE id = $1
        UNION ALL
        SELECT t.title, 'Attendance recorded', a.status, a.created_at
        FROM attendance a
        JOIN trainings t ON t.id = a.training_id
        WHERE a.participant_id = $1
        UNION ALL
        SELECT COALESCE(progress, 'Evaluation'), 'Evaluation recorded', COALESCE(remarks, ''), created_at
        FROM evaluations WHERE participant_id = $1
      ) AS activity
      ORDER BY created_at DESC`,
      [participantId]
    );

    const summary = attendanceSummaryResult.rows[0] || { total: 0, attended: 0 };
    const total = summary.total || 0;
    const attended = summary.attended || 0;
    const evaluations = evaluationsResult.rows;
    const latest = evaluations[0] || null;

    const followUps = evaluations
      .filter((e) => e.follow_up)
      .map((e) => ({
        id: e.id,
        follow_up: e.follow_up,
        next_review_at: e.next_review_at,
        created_at: e.created_at,
      }));

    res.json({
      participant,
      attendance: {
        total,
        attended,
        rate: total === 0 ? 0 : Math.round((attended / total) * 100),
        byTraining: byTrainingResult.rows,
        records: attendanceRecordsResult.rows,
      },
      evaluations,
      latestProgress: latest?.progress || null,
      achievements: latest?.achievements || null,
      followUps,
      activities: activitiesResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
