import { useEffect, useState } from 'react';
import { getSummary } from '../lib/api';

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Participants" value={summary?.participants ?? 0} />
        <StatCard label="Trainings" value={summary?.trainings ?? 0} />
        <StatCard label="Attendance" value={summary?.attendance ?? 0} />
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4 shadow">
        <h3 className="font-semibold">Next training</h3>
        <p className="text-sm text-slate-600">{summary?.nextTraining ? summary.nextTraining.title : 'No upcoming training'}</p>
      </div>
    </div>
  );
}
