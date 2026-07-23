import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getParticipantMonitoring } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

const TABS = ['Attendance', 'Evaluations', 'Achievements', 'Activity'];

function pctColor(pct) {
  if (pct >= 80) return { bar: '#16a34a', badge: 'bg-green-100 text-green-800' };
  if (pct >= 50) return { bar: '#d97706', badge: 'bg-amber-100 text-amber-800' };
  return { bar: '#dc2626', badge: 'bg-red-100 text-red-800' };
}

function ProgressBar({ pct }) {
  const { bar } = pctColor(pct);
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div style={{ width: `${pct}%`, background: bar }} className="h-full rounded-full" />
      </div>
      <span className="text-xs font-semibold w-10 text-right" style={{ color: bar }}>{pct}%</span>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function ParticipantProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('Attendance');
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    getParticipantMonitoring(id)
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load profile'));
  }, [id]);

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-body">
          <Link to="/monitoring" className="text-sm font-medium text-primary-700 hover:text-primary-800">← Back to monitoring</Link>
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-shell">
        <div className="page-body flex flex-1 items-center text-slate-500">Loading profile…</div>
      </div>
    );
  }

  const { participant, attendance, evaluations, latestProgress, achievements, followUps, activities } = data;
  const { badge } = pctColor(attendance.rate || 0);

  return (
    <div className="page-shell">
      <PageHeader title={participant.full_name} description="Participant monitoring profile">
        <Link to="/monitoring">
          <Button variant="secondary" size="sm" type="button">← Back</Button>
        </Link>
      </PageHeader>

      <div className="page-body gap-6">
      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
              <div>Phone: {participant.phone_number || '—'}</div>
              <div>Age: {participant.age ?? '—'}</div>
              <div>Education: {participant.education_level || '—'}</div>
              <div>Occupation: {participant.occupation || '—'}</div>
              <div>Village: {participant.village || '—'}</div>
              <div>Province: {participant.province || '—'}</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 min-w-[200px]">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Overall attendance</div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>
                {attendance.rate || 0}%
              </span>
              <span className="text-sm text-slate-600">{attendance.attended}/{attendance.total} sessions</span>
            </div>
            <div className="mt-3">
              <ProgressBar pct={attendance.rate || 0} />
            </div>
            {latestProgress && (
              <div className="mt-4 text-sm">
                <div className="text-xs text-slate-500">Latest progress</div>
                <div className="font-medium text-slate-800">{latestProgress}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === name ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === 'Attendance' && (
        <div className="space-y-6">
          <div className="surface-card p-4 overflow-x-auto">
            <h3 className="font-semibold mb-3 text-slate-800">By training</h3>
            <table className="data-table text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-4">Training</th>
                  <th className="py-2 pr-4">Attended</th>
                  <th className="py-2 pr-4">Rate</th>
                </tr>
              </thead>
              <tbody>
                {attendance.byTraining.map((row) => (
                  <tr key={row.training_id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{row.training_title}</td>
                    <td className="py-3 pr-4">{row.attended}/{row.total}</td>
                    <td className="py-3 pr-4"><ProgressBar pct={row.rate || 0} /></td>
                  </tr>
                ))}
                {attendance.byTraining.length === 0 && (
                  <tr><td colSpan="3" className="py-3 text-slate-500">No attendance records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="surface-card p-4 overflow-x-auto">
            <h3 className="font-semibold mb-3 text-slate-800">Session history</h3>
            <table className="data-table text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-4">Training</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {attendance.records.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{r.training_title}</td>
                    <td className="py-3 pr-4">{r.status}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatDateTime(r.created_at)}</td>
                  </tr>
                ))}
                {attendance.records.length === 0 && (
                  <tr><td colSpan="3" className="py-3 text-slate-500">No sessions recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Evaluations' && (
        <div className="surface-card p-4 overflow-x-auto">
          <table className="data-table text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-4">Progress</th>
                <th className="py-2 pr-4">Remarks</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{e.progress}</td>
                  <td className="py-3 pr-4 text-slate-600">{e.remarks || '—'}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatDateTime(e.created_at)}</td>
                </tr>
              ))}
              {evaluations.length === 0 && (
                <tr><td colSpan="3" className="py-3 text-slate-500">No evaluations yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Achievements' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-4">
            <h3 className="font-semibold mb-2 text-slate-800">Achievements</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{achievements || 'No achievements recorded yet.'}</p>
          </div>
          <div className="surface-card p-4">
            <h3 className="font-semibold mb-3 text-slate-800">Follow-up actions</h3>
            {followUps.length === 0 ? (
              <p className="text-sm text-slate-500">No follow-ups recorded.</p>
            ) : (
              <ul className="space-y-3">
                {followUps.map((f) => (
                  <li key={f.id} className="rounded-md border p-3 text-sm">
                    <div className="text-slate-800">{f.follow_up}</div>
                    {f.next_review_at && (
                      <div className="mt-1 text-xs text-slate-500">Next review: {formatDateTime(f.next_review_at)}</div>
                    )}
                    <div className="mt-1 text-xs text-slate-400">Recorded {formatDateTime(f.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="surface-card p-4">
          <h3 className="font-semibold mb-3 text-slate-800">Activity timeline</h3>
          <div className="space-y-3">
            {activities.map((item, idx) => (
              <div key={idx} className="flex gap-3 border-b pb-3 last:border-0">
                <div className="h-9 w-9 flex-none rounded-full bg-slate-100" />
                <div>
                  <div className="text-sm font-medium text-slate-900">{item.action}</div>
                  <div className="text-sm text-slate-600">{item.title}{item.meta ? ` · ${item.meta}` : ''}</div>
                  <div className="text-xs text-slate-400 mt-1">{formatDateTime(item.created_at)}</div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-slate-500">No activity recorded.</p>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
