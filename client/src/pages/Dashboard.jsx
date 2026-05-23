import { useEffect, useState } from 'react';
import { getSummary } from '../lib/api';
import Sparkline from '../components/Sparkline';

function StatCard({ label, value, delta, data }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow flex flex-col justify-between">
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-500">{delta ? `${delta > 0 ? '+' : ''}${delta}%` : ''}</div>
        <Sparkline data={data} width={120} height={28} />
      </div>
    </div>
  );
}

function RecentItem({ title, meta }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-9 w-9 flex-none rounded-full bg-slate-100" />
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-slate-500">{meta}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getSummary().then(setSummary).catch(() => {});
  }, []);

  const participants = summary?.participants ?? 0;
  const trainings = summary?.trainings ?? 0;
  const attendance = summary?.attendance ?? 0;
  const evaluations = summary?.evaluations ?? 0;
  const trends = summary?.trends || [];

  // fallback demo series when API doesn't provide time series
  const demoSeries = [participants - 2, participants - 1, participants, participants + 1, participants + 2].map((n) => Math.max(0, n));

  return (
    <div className="min-h-screen mx-auto max-w-7xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-extrabold">Dashboard</h2>
        <div className="text-sm text-slate-600">Overview & insights</div>
      </div>

      <div className="flex-1 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Participants" value={participants} delta={2} data={trends.length ? trends.map((row) => row.participants) : demoSeries} />
            <StatCard label="Trainings" value={trainings} delta={-1} data={trends.length ? trends.map((row) => row.trainings) : [1,2,3,2,trainings]} />
            <StatCard label="Attendance" value={attendance} delta={5} data={trends.length ? trends.map((row) => row.attendance) : [attendance - 3, attendance - 1, attendance, attendance + 2, attendance + 5]} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-white p-4 shadow">
              <div className="text-xs text-slate-500">Evaluations</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{evaluations}</div>
              <div className="mt-3 text-sm text-slate-500">Recorded progress reviews and follow-ups.</div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow">
              <div className="text-xs text-slate-500">Report readiness</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Ready</div>
              <div className="mt-3 text-sm text-slate-500">Trend data and exports are available in Reports.</div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow">
            <h3 className="font-semibold mb-2">Upcoming training</h3>
            <div className="text-sm text-slate-700">{summary?.nextTraining ? summary.nextTraining.title : 'No upcoming training'}</div>
            {summary?.nextTraining && (
              <div className="mt-3 text-sm text-slate-500">
                {summary.nextTraining.date || ''} • {summary.nextTraining.location || ''}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-4 shadow">
            <h3 className="font-semibold mb-2">Recent activity</h3>
            <div>
              {(summary?.recent || []).slice(0,5).map((r, idx) => (
                <RecentItem key={idx} title={r.title || r.action || 'Event'} meta={r.meta || r.created_at || ''} />
              ))}
              {(!summary?.recent || summary.recent.length === 0) && (
                <div className="text-sm text-slate-500">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border bg-white p-4 shadow">
            <h4 className="font-semibold mb-2">Quick actions</h4>
            <div className="flex flex-col gap-2">
              <button className="rounded bg-teal-600 px-3 py-2 text-white text-sm">Create training</button>
              <button className="rounded border px-3 py-2 text-sm">Add participant</button>
              <button className="rounded border px-3 py-2 text-sm">Record attendance</button>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow">
            <h4 className="font-semibold mb-2">Summary</h4>
            <div className="text-sm text-slate-600">Participants: {participants}</div>
            <div className="text-sm text-slate-600">Trainings: {trainings}</div>
            <div className="text-sm text-slate-600">Attendance: {attendance}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
