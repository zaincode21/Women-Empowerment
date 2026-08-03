const cron = require('node-cron');
const { generateWeeklySnapshot, generateMonthlySnapshot } = require('./reportGenerator');

function startReportScheduler() {
  const enabled = String(process.env.REPORT_SCHEDULER_ENABLED || 'true').toLowerCase() !== 'false';
  if (!enabled) {
    console.log('[reports] Scheduler disabled (REPORT_SCHEDULER_ENABLED=false)');
    return;
  }

  // Every Monday at 07:00 — weekly program snapshot
  cron.schedule('0 7 * * 1', async () => {
    try {
      const snap = await generateWeeklySnapshot('scheduled');
      console.log(`[reports] Weekly snapshot #${snap.id} generated (${snap.period_label})`);
    } catch (err) {
      console.error('[reports] Weekly snapshot failed:', err.message);
    }
  });

  // 1st of each month at 07:15 — monthly program snapshot
  cron.schedule('15 7 1 * *', async () => {
    try {
      const snap = await generateMonthlySnapshot('scheduled');
      console.log(`[reports] Monthly snapshot #${snap.id} generated (${snap.period_label})`);
    } catch (err) {
      console.error('[reports] Monthly snapshot failed:', err.message);
    }
  });

  console.log('[reports] Scheduler armed (weekly Mon 07:00, monthly 1st 07:15)');
}

module.exports = { startReportScheduler };
