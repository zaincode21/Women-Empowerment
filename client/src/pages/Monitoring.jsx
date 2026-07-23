import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMonitoringParticipants } from '../lib/api';
import ViewToggle from '../components/ViewToggle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { inputClassName } from '../components/ui/Field';

function pctColor(pct) {
  if (pct >= 80) return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  if (pct >= 50) return 'bg-amber-100 text-amber-800 ring-amber-200';
  return 'bg-rose-100 text-rose-800 ring-rose-200';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function MonitoringCard({ row, onView }) {
  const initial = row.full_name?.charAt(0)?.toUpperCase() || '?';
  const rate = row.attendance_rate || 0;

  return (
    <article
      className="surface-card flex h-full cursor-pointer flex-col p-4 transition-shadow hover:shadow-md"
      onClick={onView}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onView(); }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{row.full_name}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">{row.village || row.occupation || '—'}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">Attendance</span>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${pctColor(rate)}`}>
            {rate}%
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {row.attendance_attended || 0}/{row.attendance_total || 0} sessions
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Latest progress</dt>
          <dd className="line-clamp-2 text-slate-700">{row.latest_progress || '—'}</dd>
        </div>
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <dt className="text-xs text-slate-500">Last evaluation</dt>
            <dd className="text-slate-700">{formatDate(row.last_evaluation_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Last activity</dt>
            <dd className="text-slate-700">{formatDate(row.last_activity_at)}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={(e) => { e.stopPropagation(); onView(); }}
        >
          View profile
        </Button>
      </div>
    </article>
  );
}

export default function Monitoring() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('cards');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      getMonitoringParticipants(search.trim() || undefined)
        .then(setList)
        .catch(() => setList([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="page-shell">
      <PageHeader
        title="Monitoring"
        description="Track participant progress, attendance rates, and follow-up activity."
      >
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClassName()} min-w-[220px]`}
        />
        <ViewToggle value={view} onChange={setView} />
      </PageHeader>

      <div className="page-body">
        {loading ? (
          <div className="surface-card flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-slate-500">
            Loading participants…
          </div>
        ) : list.length === 0 ? (
          <EmptyState title="No participants found" description="Try a different search or register participants first." />
        ) : view === 'table' ? (
          <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Attendance</th>
                    <th>Latest progress</th>
                    <th>Last evaluation</th>
                    <th>Last activity</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/monitoring/${row.id}`)}
                    >
                      <td>
                        <div className="font-medium text-slate-900">{row.full_name}</div>
                        <div className="text-xs text-slate-500">{row.village || row.occupation || ''}</div>
                      </td>
                      <td>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${pctColor(row.attendance_rate || 0)}`}>
                          {row.attendance_rate || 0}%
                        </span>
                        <div className="mt-1 text-xs text-slate-500">
                          {row.attendance_attended || 0}/{row.attendance_total || 0} sessions
                        </div>
                      </td>
                      <td>{row.latest_progress || '—'}</td>
                      <td className="text-slate-600">{formatDate(row.last_evaluation_at)}</td>
                      <td className="text-slate-600">{formatDate(row.last_activity_at)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => { e.stopPropagation(); navigate(`/monitoring/${row.id}`); }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-4 content-start">
            {list.map((row) => (
              <MonitoringCard
                key={row.id}
                row={row}
                onView={() => navigate(`/monitoring/${row.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
