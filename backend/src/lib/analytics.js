const ATTENDED_STATUSES = ['Present', 'Late'];

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
    LIMIT 8`
    ,
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

  return {
    programCompletionRate: completion.program_completion_rate || 0,
    trackedPairs: completion.tracked_pairs || 0,
    completedPairs: completion.completed_pairs || 0,
    attendanceByTraining: attendanceByTrainingResult.rows,
    participantsByEducation: participantsByEducationResult.rows,
  };
}

module.exports = { loadDashboardAnalytics };
