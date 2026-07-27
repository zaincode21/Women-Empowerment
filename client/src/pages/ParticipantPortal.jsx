import { useEffect, useState } from 'react';
import { getMyPortal } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function StatCard({ label, value }) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value ?? '—'}</div>
    </div>
  );
}

export default function ParticipantPortal() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPortal()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load portal'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-shell"><p className="text-sm text-slate-500">Loading your portal…</p></div>;
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </div>
    );
  }

  const { participant, summary, trainings, attendance, evaluations, certificates } = data;

  return (
    <div className="page-shell">
      <PageHeader
        title={`Welcome, ${participant.full_name}`}
        description="Your trainings, attendance, evaluations, and certificate eligibility."
      />

      <div className="page-body space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My trainings" value={summary.trainings_count} />
          <StatCard label="Attendance rate" value={summary.overall_attendance_rate != null ? `${summary.overall_attendance_rate}%` : '—'} />
          <StatCard label="Evaluations" value={summary.evaluations_count} />
          <StatCard label="Certificates ready" value={summary.certificates_available} />
        </div>

        <section className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">My trainings</h3>
          {trainings.length === 0 ? (
            <EmptyState title="No trainings yet" description="You are not enrolled in any training." />
          ) : (
            <div className="mt-4 overflow-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="border p-3">Training</th>
                    <th className="border p-3">Date</th>
                    <th className="border p-3">Location</th>
                    <th className="border p-3">Attendance</th>
                    <th className="border p-3">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map((t) => (
                    <tr key={t.id} className="odd:bg-white even:bg-slate-50">
                      <td className="border p-3 font-medium">{t.title}</td>
                      <td className="border p-3">{formatDate(t.start_date || t.date)}</td>
                      <td className="border p-3">{t.location || '—'}</td>
                      <td className="border p-3">{t.attendance_rate != null ? `${t.attendance_rate}%` : 'No records'}</td>
                      <td className="border p-3">
                        {t.certificate_eligible ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Eligible</span>
                        ) : (
                          <span className="text-xs text-slate-500">Not yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Recent attendance</h3>
          {attendance.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No attendance records yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {attendance.slice(0, 10).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-slate-800">{a.training_title}</span>
                  <span className="text-slate-500">{a.status} · {formatDate(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Evaluations & progress</h3>
          {evaluations.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No evaluations recorded yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {evaluations.map((e) => (
                <article key={e.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
                  <div className="text-xs text-slate-500">{formatDate(e.created_at)}</div>
                  <p className="mt-1 text-sm font-medium text-slate-900">{e.progress || 'Progress update'}</p>
                  {e.remarks && <p className="mt-1 text-sm text-slate-600">{e.remarks}</p>}
                  {e.achievements && <p className="mt-1 text-sm text-emerald-700">Achievements: {e.achievements}</p>}
                  {e.follow_up && <p className="mt-1 text-sm text-slate-600">Follow-up: {e.follow_up}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Certificates</h3>
          <p className="mt-1 text-sm text-slate-500">Eligible when attendance is at least 80% for a training.</p>
          {certificates.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No certificates available yet. Keep attending sessions.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {certificates.map((c) => (
                <li key={c.training_id} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-900">{c.training_title}</div>
                    <div className="text-xs text-slate-500">{c.attendance_rate}% attendance · {formatDate(c.date)}</div>
                  </div>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">Ready</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
