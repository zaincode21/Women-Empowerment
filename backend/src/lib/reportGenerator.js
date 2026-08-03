const db = require('../db');
const { loadDashboardAnalytics, ATTENDED_STATUSES } = require('./analytics');

function toDateString(value) {
  return new Date(value).toISOString().slice(0, 10);
}

async function buildSnapshotPayload({ periodType, periodStart, periodEnd }) {
  const analytics = await loadDashboardAnalytics(db);

  const countsResult = await db.query(
    `SELECT
      (SELECT COUNT(*)::int FROM participants WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day')) AS participants,
      (SELECT COUNT(*)::int FROM trainings WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day')) AS trainings,
      (SELECT COUNT(*)::int FROM attendance WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day')) AS attendance,
      (SELECT COUNT(*)::int FROM evaluations WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day')) AS evaluations,
      (SELECT COUNT(*)::int FROM attendance WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day') AND status = ANY($3::text[])) AS attended`,
    [periodStart, periodEnd, ATTENDED_STATUSES]
  );

  const counts = countsResult.rows[0] || {
    participants: 0,
    trainings: 0,
    attendance: 0,
    evaluations: 0,
    attended: 0,
  };
  const attendanceTotal = counts.attendance || 0;

  const topTrainings = await db.query(
    `SELECT
      t.title,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE a.status = ANY($3::text[]))::int AS attended,
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE a.status = ANY($3::text[]))::numeric / COUNT(*)) * 100)::int
      END AS rate
    FROM attendance a
    JOIN trainings t ON t.id = a.training_id
    WHERE a.created_at >= $1 AND a.created_at < ($2::date + interval '1 day')
    GROUP BY t.id, t.title
    ORDER BY rate ASC, t.title
    LIMIT 8`,
    [periodStart, periodEnd, ATTENDED_STATUSES]
  );

  return {
    generatedAt: new Date().toISOString(),
    periodType,
    periodStart: toDateString(periodStart),
    periodEnd: toDateString(periodEnd),
    metrics: {
      participants: counts.participants || 0,
      trainings: counts.trainings || 0,
      attendance: attendanceTotal,
      evaluations: counts.evaluations || 0,
      attendanceRate: attendanceTotal === 0 ? 0 : Math.round(((counts.attended || 0) / attendanceTotal) * 100),
      programCompletionRate: analytics.programCompletionRate,
    },
    periodComparison: analytics.periodComparison,
    attendanceByDistrict: analytics.attendanceByDistrict,
    trainerPerformance: analytics.trainerPerformance,
    trainingsInPeriod: topTrainings.rows,
    insights: analytics.insights,
  };
}

async function createReportSnapshot({
  periodType,
  periodLabel,
  periodStart,
  periodEnd,
  triggerSource = 'scheduled',
}) {
  const summary = await buildSnapshotPayload({ periodType, periodStart, periodEnd });
  const result = await db.query(
    `INSERT INTO report_snapshots
      (period_type, period_label, period_start, period_end, trigger_source, summary)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)
     RETURNING id, period_type, period_label, period_start, period_end, trigger_source, summary, created_at`,
    [periodType, periodLabel, periodStart, periodEnd, triggerSource, JSON.stringify(summary)]
  );
  return result.rows[0];
}

function startOfWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function endOfWeek(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return end;
}

function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function formatPeriodLabel(periodType, start, end) {
  const fmt = (d) => d.toISOString().slice(0, 10);
  if (periodType === 'monthly') {
    return new Date(start).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  return `${fmt(start)} → ${fmt(end)}`;
}

async function generateWeeklySnapshot(triggerSource = 'scheduled') {
  const periodStart = startOfWeek();
  const periodEnd = endOfWeek();
  return createReportSnapshot({
    periodType: 'weekly',
    periodLabel: formatPeriodLabel('weekly', periodStart, periodEnd),
    periodStart: toDateString(periodStart),
    periodEnd: toDateString(periodEnd),
    triggerSource,
  });
}

async function generateMonthlySnapshot(triggerSource = 'scheduled') {
  const periodStart = startOfMonth();
  const periodEnd = endOfMonth();
  return createReportSnapshot({
    periodType: 'monthly',
    periodLabel: formatPeriodLabel('monthly', periodStart, periodEnd),
    periodStart: toDateString(periodStart),
    periodEnd: toDateString(periodEnd),
    triggerSource,
  });
}

module.exports = {
  buildSnapshotPayload,
  createReportSnapshot,
  generateWeeklySnapshot,
  generateMonthlySnapshot,
  formatPeriodLabel,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
};
