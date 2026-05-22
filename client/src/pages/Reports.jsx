import { useEffect, useState } from 'react';
import { getSummary } from '../lib/api';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  useEffect(() => { getSummary().then(setSummary).catch(() => {}); }, []);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      <div className="rounded border bg-white p-4">
        <div className="text-sm text-slate-600">Participants: {summary?.participants ?? 0}</div>
        <div className="text-sm text-slate-600">Trainings: {summary?.trainings ?? 0}</div>
        <div className="text-sm text-slate-600">Attendance: {summary?.attendance ?? 0}</div>
      </div>
    </div>
  );
}
