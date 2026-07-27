const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const ATTENDED = ['Present', 'Late'];

router.use(authenticate);

router.get('/portal', async (req, res) => {
  if (req.user.role !== 'participant' && req.user.account_type !== 'participant') {
    return res.status(403).json({ error: 'Participant access only' });
  }

  const participantId = req.user.participant_id || req.user.id;

  try {
    const participantResult = await db.query(
      `SELECT id, full_name, age, date_of_birth, village, cell, sector, district, province,
              address, phone_number, email, education_level, occupation, status, created_at
       FROM participants WHERE id=$1`,
      [participantId]
    );
    const participant = participantResult.rows[0];
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const trainingsResult = await db.query(
      `SELECT t.id, t.title, t.date, t.start_date, t.end_date, t.location, t.trainer_name, e.enrolled_at
       FROM training_enrollments e
       JOIN trainings t ON t.id = e.training_id
       WHERE e.participant_id = $1
       ORDER BY COALESCE(t.start_date, t.date) DESC NULLS LAST, t.title`,
      [participantId]
    );

    const attendanceResult = await db.query(
      `SELECT a.id, a.training_id, a.status, a.created_at, t.title AS training_title
       FROM attendance a
       JOIN trainings t ON t.id = a.training_id
       WHERE a.participant_id = $1
       ORDER BY a.created_at DESC`,
      [participantId]
    );

    const evaluationsResult = await db.query(
      `SELECT id, progress, remarks, achievements, follow_up, next_review_at, created_at
       FROM evaluations
       WHERE participant_id = $1
       ORDER BY created_at DESC`,
      [participantId]
    );

    const trainings = trainingsResult.rows.map((training) => {
      const records = attendanceResult.rows.filter((a) => a.training_id === training.id);
      const attended = records.filter((a) => ATTENDED.includes(a.status)).length;
      const attendance_rate = records.length
        ? Math.round((attended / records.length) * 100)
        : null;
      const certificate_eligible = attendance_rate !== null && attendance_rate >= 80;
      return {
        ...training,
        attendance_records: records.length,
        attended_records: attended,
        attendance_rate,
        certificate_eligible,
      };
    });

    const totalAttendance = attendanceResult.rows.length;
    const totalAttended = attendanceResult.rows.filter((a) => ATTENDED.includes(a.status)).length;
    const overall_attendance_rate = totalAttendance
      ? Math.round((totalAttended / totalAttendance) * 100)
      : null;

    res.json({
      participant,
      summary: {
        trainings_count: trainings.length,
        attendance_records: totalAttendance,
        overall_attendance_rate,
        evaluations_count: evaluationsResult.rows.length,
        certificates_available: trainings.filter((t) => t.certificate_eligible).length,
      },
      trainings,
      attendance: attendanceResult.rows,
      evaluations: evaluationsResult.rows,
      certificates: trainings
        .filter((t) => t.certificate_eligible)
        .map((t) => ({
          training_id: t.id,
          training_title: t.title,
          attendance_rate: t.attendance_rate,
          trainer_name: t.trainer_name,
          date: t.start_date || t.date,
        })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
