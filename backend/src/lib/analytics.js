const ATTENDED_STATUSES = ['Present', 'Late'];

async function loadPeriodStats(db, start, end) {
  const result = await db.query(
    `SELECT
      (SELECT COUNT(*)::int FROM participants WHERE created_at >= $1 AND created_at < $2) AS participants,
      (SELECT COUNT(*)::int FROM trainings WHERE created_at >= $1 AND created_at < $2) AS trainings,
      (SELECT COUNT(*)::int FROM attendance WHERE created_at >= $1 AND created_at < $2) AS attendance,
      (SELECT COUNT(*)::int FROM evaluations WHERE created_at >= $1 AND created_at < $2) AS evaluations,
      (SELECT COUNT(*)::int FROM attendance WHERE created_at >= $1 AND created_at < $2 AND status = ANY($3::text[])) AS attended`,
    [start, end, ATTENDED_STATUSES]
  );
  const row = result.rows[0] || {
    participants: 0,
    trainings: 0,
    attendance: 0,
    evaluations: 0,
    attended: 0,
  };
  const attendance = row.attendance || 0;
  return {
    participants: row.participants || 0,
    trainings: row.trainings || 0,
    attendance,
    evaluations: row.evaluations || 0,
    attendanceRate: attendance === 0 ? 0 : Math.round(((row.attended || 0) / attendance) * 100),
  };
}

function pctDelta(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function loadDashboardAnalytics(db) {
  const attendanceByTrainingResult = await db.query(
    `SELECT
      t.title,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE a.status = ANY($1::text[]))::int AS attended,
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE a.status = ANY($1::text[]))::numeric / COUNT(*)) * 100)::int
      END AS rate
    FROM attendance a
    JOIN trainings t ON t.id = a.training_id
    GROUP BY t.id, t.title
    ORDER BY rate DESC, t.title
    LIMIT 8`,
    [ATTENDED_STATUSES]
  );

  const participantsByEducationResult = await db.query(
    `SELECT
      COALESCE(NULLIF(TRIM(education_level), ''), 'Not specified') AS level,
      COUNT(*)::int AS count
    FROM participants
    GROUP BY 1
    ORDER BY count DESC`
  );

  const completionResult = await db.query(
    `WITH pairs AS (
      SELECT
        participant_id,
        training_id,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = ANY($1::text[]))::int AS attended
      FROM attendance
      GROUP BY participant_id, training_id
    )
    SELECT
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE total > 0 AND (attended::numeric / total) >= 0.8)::numeric / COUNT(*)) * 100
        )::int
      END AS program_completion_rate,
      COUNT(*)::int AS tracked_pairs,
      COUNT(*) FILTER (WHERE total > 0 AND (attended::numeric / total) >= 0.8)::int AS completed_pairs
    FROM pairs`,
    [ATTENDED_STATUSES]
  );

  const completion = completionResult.rows[0] || {
    program_completion_rate: 0,
    tracked_pairs: 0,
    completed_pairs: 0,
  };

  const currentStart = await db.query(`SELECT date_trunc('month', NOW()) AS start`);
  const monthStart = currentStart.rows[0].start;
  const prevStartResult = await db.query(`SELECT $1::timestamptz - interval '1 month' AS start`, [monthStart]);
  const prevStart = prevStartResult.rows[0].start;
  const nextMonthResult = await db.query(`SELECT $1::timestamptz + interval '1 month' AS start`, [monthStart]);
  const nextMonth = nextMonthResult.rows[0].start;

  const [currentPeriod, previousPeriod] = await Promise.all([
    loadPeriodStats(db, monthStart, nextMonth),
    loadPeriodStats(db, prevStart, monthStart),
  ]);

  const currentLabelResult = await db.query(`SELECT to_char($1::timestamptz, 'Mon YYYY') AS label`, [monthStart]);
  const previousLabelResult = await db.query(`SELECT to_char($1::timestamptz, 'Mon YYYY') AS label`, [prevStart]);

  const periodComparison = {
    current: { label: currentLabelResult.rows[0].label, ...currentPeriod },
    previous: { label: previousLabelResult.rows[0].label, ...previousPeriod },
    deltas: {
      participants: pctDelta(currentPeriod.participants, previousPeriod.participants),
      trainings: pctDelta(currentPeriod.trainings, previousPeriod.trainings),
      attendance: pctDelta(currentPeriod.attendance, previousPeriod.attendance),
      evaluations: pctDelta(currentPeriod.evaluations, previousPeriod.evaluations),
      attendanceRate: currentPeriod.attendanceRate - previousPeriod.attendanceRate,
    },
  };

  const districtResult = await db.query(
    `SELECT
      COALESCE(NULLIF(TRIM(p.district), ''), 'Not specified') AS district,
      COUNT(DISTINCT p.id)::int AS participants,
      COUNT(a.id)::int AS attendance_total,
      COUNT(a.id) FILTER (WHERE a.status = ANY($1::text[]))::int AS attendance_attended,
      CASE
        WHEN COUNT(a.id) = 0 THEN 0
        ELSE ROUND((COUNT(a.id) FILTER (WHERE a.status = ANY($1::text[]))::numeric / COUNT(a.id)) * 100)::int
      END AS attendance_rate
    FROM participants p
    LEFT JOIN attendance a ON a.participant_id = p.id
    GROUP BY 1
    ORDER BY participants DESC, district
    LIMIT 10`,
    [ATTENDED_STATUSES]
  );

  const trainerResult = await db.query(
    `SELECT
      COALESCE(NULLIF(TRIM(t.trainer_name), ''), 'Unassigned') AS trainer_name,
      t.trainer_id,
      COUNT(DISTINCT t.id)::int AS trainings,
      COUNT(a.id)::int AS attendance_total,
      COUNT(a.id) FILTER (WHERE a.status = ANY($1::text[]))::int AS attendance_attended,
      CASE
        WHEN COUNT(a.id) = 0 THEN 0
        ELSE ROUND((COUNT(a.id) FILTER (WHERE a.status = ANY($1::text[]))::numeric / COUNT(a.id)) * 100)::int
      END AS attendance_rate,
      COUNT(DISTINCT e.id)::int AS evaluations
    FROM trainings t
    LEFT JOIN attendance a ON a.training_id = t.id
    LEFT JOIN evaluations e ON e.training_id = t.id
    GROUP BY t.trainer_id, COALESCE(NULLIF(TRIM(t.trainer_name), ''), 'Unassigned')
    ORDER BY attendance_rate DESC NULLS LAST, trainings DESC
    LIMIT 10`,
    [ATTENDED_STATUSES]
  );

  const lowAttendanceTrainings = attendanceByTrainingResult.rows
    .filter((row) => row.total >= 3 && row.rate < 50)
    .slice(0, 5);

  const lowDistricts = districtResult.rows
    .filter((row) => row.attendance_total >= 3 && row.attendance_rate < 50)
    .slice(0, 5);

  const insights = [];

  const rateDelta = periodComparison.deltas.attendanceRate;
  if (rateDelta <= -5) {
    insights.push({
      severity: 'warning',
      text: `Attendance rate fell ${Math.abs(rateDelta)} points vs ${periodComparison.previous.label} (${periodComparison.current.attendanceRate}% now). Review low-performing trainings.`,
    });
  } else if (rateDelta >= 5) {
    insights.push({
      severity: 'success',
      text: `Attendance rate improved ${rateDelta} points vs ${periodComparison.previous.label} (${periodComparison.current.attendanceRate}% now).`,
    });
  }

  if (lowAttendanceTrainings.length) {
    insights.push({
      severity: 'warning',
      text: `${lowAttendanceTrainings.length} training(s) are below 50% attendance: ${lowAttendanceTrainings.map((t) => t.title).join(', ')}.`,
    });
  }

  if (lowDistricts.length) {
    insights.push({
      severity: 'warning',
      text: `Districts needing follow-up (under 50% attendance): ${lowDistricts.map((d) => d.district).join(', ')}.`,
    });
  }

  const topTrainer = trainerResult.rows.find((row) => row.attendance_total >= 3);
  if (topTrainer) {
    insights.push({
      severity: 'info',
      text: `Strongest trainer attendance: ${topTrainer.trainer_name} at ${topTrainer.attendance_rate}% across ${topTrainer.trainings} training(s).`,
    });
  }

  if (completion.tracked_pairs > 0 && (completion.program_completion_rate || 0) < 40) {
    insights.push({
      severity: 'warning',
      text: `Program completion (80%+ attendance) is only ${completion.program_completion_rate}%. Prioritize retention and make-up sessions.`,
    });
  } else if ((completion.program_completion_rate || 0) >= 70) {
    insights.push({
      severity: 'success',
      text: `Program completion is healthy at ${completion.program_completion_rate}% of tracked participant-training pairs.`,
    });
  }

  if (!insights.length) {
    insights.push({
      severity: 'info',
      text: 'No critical alerts. Continue monitoring attendance by district and trainer performance.',
    });
  }

  return {
    programCompletionRate: completion.program_completion_rate || 0,
    trackedPairs: completion.tracked_pairs || 0,
    completedPairs: completion.completed_pairs || 0,
    attendanceByTraining: attendanceByTrainingResult.rows,
    participantsByEducation: participantsByEducationResult.rows,
    periodComparison,
    attendanceByDistrict: districtResult.rows,
    trainerPerformance: trainerResult.rows,
    insights,
  };
}

module.exports = { loadDashboardAnalytics, loadPeriodStats, ATTENDED_STATUSES };
