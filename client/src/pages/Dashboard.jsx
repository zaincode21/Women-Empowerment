import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSummary } from '../lib/api';
import { canAccess } from '../lib/auth';
import Sparkline from '../components/Sparkline';
import { ProgramAnalytics } from '../components/ProgramAnalytics';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

function computeDelta(trends, key) {
  if (!trends || trends.length < 2) return null;
  const prev = trends[trends.length - 2][key] ?? 0;
  const curr = trends[trends.length - 1][key] ?? 0;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function StatCard({ label, value, delta, data }) {
  return (
    <div className="surface-card flex flex-col justify-between p-5">
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {delta !== null && delta !== undefined ? `${delta > 0 ? '+' : ''}${delta}% vs last month` : ''}
        </div>
        <Sparkline data={data} width={120} height={28} />
      </div>
    </div>
  );
}

function RecentItem({ title, meta, created_at }) {
  const when = created_at
    ? new Date(created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : meta;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-9 w-9 flex-none rounded-full bg-primary-50 ring-1 ring-primary-100" />
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-slate-500">{when}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getSummary().then(setSummary).catch(() => {});
  }, []);

  const participants = summary?.participants ?? 0;
  const trainings = summary?.trainings ?? 0;
  const attendance = summary?.attendance ?? 0;
  const trends = summary?.trends || [];

  const participantDelta = computeDelta(trends, 'participants');
  const trainingDelta = computeDelta(trends, 'trainings');
  const attendanceDelta = computeDelta(trends, 'attendance');

  const participantSeries = trends.length ? trends.map((row) => row.participants) : [participants];
  const trainingSeries = trends.length ? trends.map((row) => row.trainings) : [trainings];
  const attendanceSeries = trends.length ? trends.map((row) => row.attendance) : [attendance];

  return (
    <div className="page-shell">
      <PageHeader
        title="Dashboard"
        description="Overview of program activity, attendance performance, and recent updates."
      >
        {canAccess('reports') && (
          <Button onClick={() => navigate('/reports')}>Reports</Button>
        )}
      </PageHeader>

      <div className="page-body">
      <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Participants" value={participants} delta={participantDelta} data={participantSeries} />
            <StatCard label="Trainings" value={trainings} delta={trainingDelta} data={trainingSeries} />
            <StatCard label="Attendance" value={attendance} delta={attendanceDelta} data={attendanceSeries} />
          </div>

          <ProgramAnalytics summary={summary} />

          <div className="surface-card p-5">
            <h3 className="mb-2 font-semibold text-slate-900">Upcoming training</h3>
            <div className="text-sm text-slate-700">{summary?.nextTraining ? summary.nextTraining.title : 'No upcoming training'}</div>
            {summary?.nextTraining && (
              <div className="mt-3 text-sm text-slate-500">
                {summary.nextTraining.date ? new Date(summary.nextTraining.date).toLocaleDateString() : ''} • {summary.nextTraining.location || ''}
              </div>
            )}
          </div>

          <div className="surface-card p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Recent activity</h3>
            <div>
              {(summary?.recent || []).slice(0, 5).map((r, idx) => (
                <RecentItem key={idx} title={r.title || r.action || 'Event'} meta={r.meta} created_at={r.created_at} />
              ))}
              {(!summary?.recent || summary.recent.length === 0) && (
                <div className="text-sm text-slate-500">No recent activity</div>
              )}
            </div>
          </div>
      </div>
      </div>
    </div>
  );
}
