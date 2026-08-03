import { useEffect, useState } from 'react';
import {
  generateReportSnapshot,
  getAttendanceReport,
  getEvaluationsReport,
  getParticipants,
  getProgressReport,
  getReportSnapshot,
  getReportSnapshots,
  getSummary,
  getTrainings,
  getTrainingsReport,
  getTrainers,
} from '../lib/api';
import { downloadCsv, downloadExcel, downloadPdf, snapshotToExportSections } from '../lib/export';
import { ProgramAnalytics } from '../components/ProgramAnalytics';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { inputClassName, selectClassName } from '../components/ui/Field';
import Alert from '../components/Alert';

const TABS = ['Summary', 'Attendance', 'Trainings', 'Progress', 'Evaluations', 'Auto'];

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

function FilterBar({ children }) {
  return <div className="surface-card flex flex-wrap items-end gap-3 p-4 print:hidden">{children}</div>;
}

function FilterField({ label, children }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('Summary');
  const [summary, setSummary] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [report, setReport] = useState(null);
  const [reportTab, setReportTab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotDetail, setSnapshotDetail] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [alert, setAlert] = useState(null);

  const [attendanceFilters, setAttendanceFilters] = useState({ training_id: '', participant_id: '', from: '', to: '' });
  const [trainingsFilters, setTrainingsFilters] = useState({ trainer_id: '', from: '', to: '' });
  const [progressFilters, setProgressFilters] = useState({ participant_id: '' });
  const [evaluationFilters, setEvaluationFilters] = useState({ participant_id: '', training_id: '', from: '', to: '' });

  useEffect(() => {
    getSummary().then(setSummary).catch(() => {});
    Promise.all([getParticipants(), getTrainings(), getTrainers()])
      .then(([p, t, tr]) => {
        setParticipants(p);
        setTrainings(t);
        setTrainers(tr);
      })
      .catch(() => {});
  }, []);

  async function refreshSnapshots() {
    try {
      setSnapshots(await getReportSnapshots());
    } catch {
      setSnapshots([]);
    }
  }

  useEffect(() => {
    if (tab === 'Auto') refreshSnapshots();
  }, [tab]);

  useEffect(() => {
    if (tab === 'Auto') return undefined;

    setLoading(true);
    setReport(null);
    setReportTab(null);

    const load = async () => {
      const activeTab = tab;
      try {
        let data = null;
        if (activeTab === 'Summary') {
          data = await getSummary();
        } else if (activeTab === 'Attendance') {
          data = await getAttendanceReport(attendanceFilters);
        } else if (activeTab === 'Trainings') {
          data = await getTrainingsReport(trainingsFilters);
        } else if (activeTab === 'Progress') {
          data = await getProgressReport(progressFilters);
        } else if (activeTab === 'Evaluations') {
          data = await getEvaluationsReport(evaluationFilters);
        }
        setReport(data);
        setReportTab(activeTab);
      } catch {
        setReport(null);
        setReportTab(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tab, attendanceFilters, trainingsFilters, progressFilters, evaluationFilters]);

  const tabReport = reportTab === tab ? report : null;
  const trends = (tab === 'Summary' ? tabReport?.trends : summary?.trends) || [];

  function buildExportPayload() {
    if (tab === 'Summary') {
      const data = tabReport || summary;
      return {
        title: 'Program Summary Report',
        subtitle: `Generated ${new Date().toLocaleString()}`,
        csvRows: [
          ['Metric', 'Value'],
          ['Participants', data?.participants ?? 0],
          ['Trainings', data?.trainings ?? 0],
          ['Attendance', data?.attendance ?? 0],
          ['Evaluations', data?.evaluations ?? 0],
          [],
          ['Month', 'Participants', 'Trainings', 'Attendance', 'Evaluations'],
          ...trends.map((row) => [row.month, row.participants, row.trainings, row.attendance, row.evaluations]),
        ],
        sections: [
          {
            heading: 'Key metrics',
            headers: ['Metric', 'Value'],
            rows: [
              ['Participants', data?.participants ?? 0],
              ['Trainings', data?.trainings ?? 0],
              ['Attendance', data?.attendance ?? 0],
              ['Evaluations', data?.evaluations ?? 0],
              ['Program completion', `${data?.programCompletionRate ?? 0}%`],
            ],
          },
          {
            heading: 'Monthly trends',
            headers: ['Month', 'Participants', 'Trainings', 'Attendance', 'Evaluations'],
            rows: trends.map((row) => [row.month, row.participants, row.trainings, row.attendance, row.evaluations]),
          },
          {
            heading: 'Insights',
            headers: ['Severity', 'Insight'],
            rows: (data?.insights || []).map((i) => [i.severity, i.text]),
          },
          {
            heading: 'District attendance',
            headers: ['District', 'Participants', 'Rate', 'Records'],
            rows: (data?.attendanceByDistrict || []).map((d) => [d.district, d.participants, `${d.attendance_rate}%`, d.attendance_total]),
          },
          {
            heading: 'Trainer performance',
            headers: ['Trainer', 'Trainings', 'Rate', 'Evaluations'],
            rows: (data?.trainerPerformance || []).map((t) => [t.trainer_name, t.trainings, `${t.attendance_rate}%`, t.evaluations]),
          },
        ],
        sheets: [
          {
            name: 'Summary',
            rows: [
              ['Metric', 'Value'],
              ['Participants', data?.participants ?? 0],
              ['Trainings', data?.trainings ?? 0],
              ['Attendance', data?.attendance ?? 0],
              ['Evaluations', data?.evaluations ?? 0],
            ],
          },
          {
            name: 'Trends',
            rows: [
              ['Month', 'Participants', 'Trainings', 'Attendance', 'Evaluations'],
              ...trends.map((row) => [row.month, row.participants, row.trainings, row.attendance, row.evaluations]),
            ],
          },
          {
            name: 'Districts',
            rows: [
              ['District', 'Participants', 'Attendance rate', 'Records'],
              ...(data?.attendanceByDistrict || []).map((d) => [d.district, d.participants, d.attendance_rate, d.attendance_total]),
            ],
          },
          {
            name: 'Trainers',
            rows: [
              ['Trainer', 'Trainings', 'Attendance rate', 'Evaluations'],
              ...(data?.trainerPerformance || []).map((t) => [t.trainer_name, t.trainings, t.attendance_rate, t.evaluations]),
            ],
          },
        ],
        filenameBase: 'summary-report',
      };
    }

    if (tab === 'Attendance' && tabReport?.rows) {
      const rows = [
        ['Participant', 'Training', 'Status', 'Date'],
        ...tabReport.rows.map((r) => [r.participant_name, r.training_title, r.status, formatDateTime(r.created_at)]),
      ];
      return {
        title: 'Attendance Report',
        subtitle: `Rate ${tabReport.summary?.rate ?? 0}% · ${tabReport.summary?.total ?? 0} records`,
        csvRows: rows,
        sections: [{
          heading: 'Attendance records',
          summaryLines: [
            `Total: ${tabReport.summary?.total ?? 0}`,
            `Attended: ${tabReport.summary?.attended ?? 0}`,
            `Absent: ${tabReport.summary?.absent ?? 0}`,
            `Rate: ${tabReport.summary?.rate ?? 0}%`,
          ],
          headers: rows[0],
          rows: rows.slice(1),
        }],
        sheets: [{ name: 'Attendance', rows }],
        filenameBase: 'attendance-report',
      };
    }

    if (tab === 'Trainings' && tabReport?.rows) {
      const rows = [
        ['Title', 'Trainer', 'Date', 'Location', 'Attendance records'],
        ...tabReport.rows.map((r) => [r.title, r.trainer_name, formatDate(r.date), r.location, r.attendance_count]),
      ];
      return {
        title: 'Trainings Report',
        subtitle: `${tabReport.summary?.total ?? 0} trainings`,
        csvRows: rows,
        sections: [{ heading: 'Trainings', headers: rows[0], rows: rows.slice(1) }],
        sheets: [{ name: 'Trainings', rows }],
        filenameBase: 'trainings-report',
      };
    }

    if (tab === 'Progress' && tabReport?.rows) {
      const rows = [
        ['Participant', 'Attendance rate', 'Sessions attended', 'Total sessions', 'Latest progress', 'Training', 'Evaluations'],
        ...tabReport.rows.map((r) => [
          r.participant_name,
          `${r.attendance_rate}%`,
          r.attendance_attended,
          r.attendance_total,
          r.latest_progress || '',
          r.latest_training_title || '',
          r.evaluation_count,
        ]),
      ];
      return {
        title: 'Progress Report',
        subtitle: `Average attendance ${tabReport.summary?.averageAttendanceRate ?? 0}%`,
        csvRows: rows,
        sections: [{ heading: 'Participant progress', headers: rows[0], rows: rows.slice(1) }],
        sheets: [{ name: 'Progress', rows }],
        filenameBase: 'progress-report',
      };
    }

    if (tab === 'Evaluations' && tabReport?.rows) {
      const rows = [
        ['Participant', 'Training', 'Progress', 'Remarks', 'Achievements', 'Follow-up', 'Date'],
        ...tabReport.rows.map((r) => [
          r.participant_name,
          r.training_title || '',
          r.progress,
          r.remarks || '',
          r.achievements || '',
          r.follow_up || '',
          formatDateTime(r.created_at),
        ]),
      ];
      return {
        title: 'Evaluations Report',
        subtitle: `${tabReport.summary?.total ?? 0} evaluations`,
        csvRows: rows,
        sections: [{ heading: 'Evaluations', headers: rows[0], rows: rows.slice(1) }],
        sheets: [{ name: 'Evaluations', rows }],
        filenameBase: 'evaluations-report',
      };
    }

    return null;
  }

  function handleExportCsv() {
    const payload = buildExportPayload();
    if (!payload) return;
    downloadCsv(`${payload.filenameBase}.csv`, payload.csvRows);
  }

  function handleExportExcel() {
    const payload = buildExportPayload();
    if (!payload) return;
    downloadExcel({ filename: `${payload.filenameBase}.xlsx`, sheets: payload.sheets });
  }

  function handleExportPdf() {
    const payload = buildExportPayload();
    if (!payload) return;
    downloadPdf({ title: payload.title, subtitle: payload.subtitle, sections: payload.sections });
  }

  async function handleGenerate(periodType) {
    setGenerating(true);
    try {
      const snap = await generateReportSnapshot(periodType);
      setAlert({ type: 'success', message: `${periodType === 'monthly' ? 'Monthly' : 'Weekly'} snapshot generated.` });
      await refreshSnapshots();
      const detail = await getReportSnapshot(snap.id);
      setSnapshotDetail(detail);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to generate snapshot' });
    } finally {
      setGenerating(false);
    }
  }

  async function openSnapshot(id) {
    try {
      setSnapshotDetail(await getReportSnapshot(id));
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load snapshot' });
    }
  }

  function exportSnapshot(format) {
    if (!snapshotDetail) return;
    const payload = snapshotToExportSections(snapshotDetail);
    if (format === 'pdf') {
      downloadPdf(payload);
      return;
    }
    downloadExcel({
      filename: `auto-report-${snapshotDetail.period_label.replace(/\s+/g, '-').toLowerCase()}.xlsx`,
      sheets: payload.sections.map((section) => ({
        name: section.heading.slice(0, 31),
        rows: section.headers ? [section.headers, ...section.rows] : section.summaryLines?.map((line) => [line]) || [],
      })),
    });
  }

  return (
    <div className="page-shell">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <PageHeader
        title="Reports"
        description="Generate filtered reports, export PDF/Excel, and review automated snapshots."
      >
        {tab !== 'Auto' && (
          <>
            <Button variant="secondary" onClick={handleExportCsv}>CSV</Button>
            <Button variant="secondary" onClick={handleExportExcel}>Excel</Button>
            <Button onClick={handleExportPdf}>PDF</Button>
          </>
        )}
      </PageHeader>

      <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 print:hidden">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === name ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {name === 'Auto' ? 'Automated' : name}
          </button>
        ))}
      </div>

      <div className="page-body gap-6">
      {tab === 'Attendance' && (
        <FilterBar>
          <FilterField label="Training">
            <select className={selectClassName('min-w-[180px]')} value={attendanceFilters.training_id} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, training_id: e.target.value })}>
              <option value="">All trainings</option>
              {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </FilterField>
          <FilterField label="Participant">
            <select className={selectClassName('min-w-[180px]')} value={attendanceFilters.participant_id} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, participant_id: e.target.value })}>
              <option value="">All participants</option>
              {participants.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </FilterField>
          <FilterField label="From">
            <input type="date" className={inputClassName()} value={attendanceFilters.from} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, from: e.target.value })} />
          </FilterField>
          <FilterField label="To">
            <input type="date" className={inputClassName()} value={attendanceFilters.to} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, to: e.target.value })} />
          </FilterField>
        </FilterBar>
      )}

      {tab === 'Trainings' && (
        <FilterBar>
          <FilterField label="Trainer">
            <select className={selectClassName('min-w-[180px]')} value={trainingsFilters.trainer_id} onChange={(e) => setTrainingsFilters({ ...trainingsFilters, trainer_id: e.target.value })}>
              <option value="">All trainers</option>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </FilterField>
          <FilterField label="From">
            <input type="date" className={inputClassName()} value={trainingsFilters.from} onChange={(e) => setTrainingsFilters({ ...trainingsFilters, from: e.target.value })} />
          </FilterField>
          <FilterField label="To">
            <input type="date" className={inputClassName()} value={trainingsFilters.to} onChange={(e) => setTrainingsFilters({ ...trainingsFilters, to: e.target.value })} />
          </FilterField>
        </FilterBar>
      )}

      {tab === 'Progress' && (
        <FilterBar>
          <FilterField label="Participant">
            <select className={selectClassName('min-w-[180px]')} value={progressFilters.participant_id} onChange={(e) => setProgressFilters({ participant_id: e.target.value })}>
              <option value="">All participants</option>
              {participants.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </FilterField>
        </FilterBar>
      )}

      {tab === 'Evaluations' && (
        <FilterBar>
          <FilterField label="Participant">
            <select className={selectClassName('min-w-[180px]')} value={evaluationFilters.participant_id} onChange={(e) => setEvaluationFilters({ ...evaluationFilters, participant_id: e.target.value })}>
              <option value="">All participants</option>
              {participants.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </FilterField>
          <FilterField label="Training">
            <select className={selectClassName('min-w-[180px]')} value={evaluationFilters.training_id} onChange={(e) => setEvaluationFilters({ ...evaluationFilters, training_id: e.target.value })}>
              <option value="">All trainings</option>
              {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </FilterField>
          <FilterField label="From">
            <input type="date" className={inputClassName()} value={evaluationFilters.from} onChange={(e) => setEvaluationFilters({ ...evaluationFilters, from: e.target.value })} />
          </FilterField>
          <FilterField label="To">
            <input type="date" className={inputClassName()} value={evaluationFilters.to} onChange={(e) => setEvaluationFilters({ ...evaluationFilters, to: e.target.value })} />
          </FilterField>
        </FilterBar>
      )}

      {tab === 'Auto' && (
        <>
          <div className="surface-card p-5">
            <h3 className="font-semibold text-slate-900">Automated report snapshots</h3>
            <p className="mt-1 text-sm text-slate-500">
              The server generates weekly (Monday 07:00) and monthly (1st at 07:15) snapshots automatically.
              You can also generate one now and export it as PDF or Excel.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={generating} onClick={() => handleGenerate('weekly')}>
                {generating ? 'Generating…' : 'Generate weekly now'}
              </Button>
              <Button variant="secondary" disabled={generating} onClick={() => handleGenerate('monthly')}>
                Generate monthly now
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">Saved snapshots</div>
              <ul className="divide-y divide-slate-100">
                {snapshots.map((snap) => (
                  <li key={snap.id}>
                    <button
                      type="button"
                      onClick={() => openSnapshot(snap.id)}
                      className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                        snapshotDetail?.id === snap.id ? 'bg-primary-50/60' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{snap.period_label}</div>
                        <div className="text-xs text-slate-500 capitalize">{snap.period_type} · {snap.trigger_source}</div>
                      </div>
                      <div className="text-xs text-slate-500">{formatDateTime(snap.created_at)}</div>
                    </button>
                  </li>
                ))}
                {snapshots.length === 0 && (
                  <li className="px-4 py-6 text-sm text-slate-500">No snapshots yet. Generate one to get started.</li>
                )}
              </ul>
            </div>

            <div className="surface-card p-5">
              {!snapshotDetail ? (
                <p className="text-sm text-slate-500">Select a snapshot to preview metrics and export.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{snapshotDetail.period_label}</h3>
                      <p className="mt-1 text-xs text-slate-500 capitalize">
                        {snapshotDetail.period_type} · {snapshotDetail.trigger_source} · {formatDateTime(snapshotDetail.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => exportSnapshot('excel')}>Excel</Button>
                      <Button onClick={() => exportSnapshot('pdf')}>PDF</Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Object.entries(snapshotDetail.summary?.metrics || {}).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                        <div className="text-xs capitalize text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                          {typeof value === 'number' && /rate|completion/i.test(key) ? `${value}%` : value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {(snapshotDetail.summary?.insights || []).map((insight, idx) => (
                      <li key={idx} className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700">
                        <span className="mr-2 text-xs font-semibold uppercase text-slate-400">{insight.severity}</span>
                        {insight.text}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {loading && tab !== 'Auto' && <div className="text-sm text-slate-500">Loading report…</div>}

      {!loading && tab === 'Summary' && tabReport && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['Participants', tabReport?.participants ?? 0],
              ['Trainings', tabReport?.trainings ?? 0],
              ['Attendance', tabReport?.attendance ?? 0],
              ['Evaluations', tabReport?.evaluations ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="surface-card p-5">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-bold">{value}</div>
              </div>
            ))}
          </div>

          <ProgramAnalytics summary={tabReport} showMetricCards={false} />
        </>
      )}

      {!loading && tab === 'Attendance' && tabReport?.summary && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="surface-card p-5"><div className="text-xs text-slate-500">Total records</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.total ?? 0}</div></div>
            <div className="surface-card p-5"><div className="text-xs text-slate-500">Attended</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.attended ?? 0}</div></div>
            <div className="surface-card p-5"><div className="text-xs text-slate-500">Absent</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.absent ?? 0}</div></div>
            <div className="surface-card p-5"><div className="text-xs text-slate-500">Attendance rate</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.rate ?? 0}%</div></div>
          </div>
          <ReportTable
            headers={['Participant', 'Training', 'Status', 'Date']}
            rows={(tabReport.rows || []).map((r) => [r.participant_name, r.training_title, r.status, formatDateTime(r.created_at)])}
          />
        </>
      )}

      {!loading && tab === 'Trainings' && tabReport?.summary && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-card p-5"><div className="text-xs text-slate-500">Total trainings</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.total ?? 0}</div></div>
            <div className="surface-card p-5"><div className="text-xs text-slate-500">With assigned trainer</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.with_trainer ?? 0}</div></div>
          </div>
          <ReportTable
            headers={['Title', 'Trainer', 'Date', 'Location', 'Attendance records']}
            rows={(tabReport.rows || []).map((r) => [r.title, r.trainer_name, formatDate(r.date), r.location, r.attendance_count])}
          />
        </>
      )}

      {!loading && tab === 'Progress' && tabReport?.summary && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="surface-card p-5"><div className="text-xs text-slate-500">Participants</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.participants ?? 0}</div></div>
            <div className="surface-card p-5"><div className="text-xs text-slate-500">Average attendance</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.averageAttendanceRate ?? 0}%</div></div>
            <div className="surface-card p-5"><div className="text-xs text-slate-500">With evaluations</div><div className="mt-2 text-2xl font-bold">{tabReport.summary.withEvaluations ?? 0}</div></div>
          </div>
          <ReportTable
            headers={['Participant', 'Attendance', 'Sessions', 'Latest progress', 'Training', 'Evaluations']}
            rows={(tabReport.rows || []).map((r) => [
              r.participant_name,
              `${r.attendance_rate}%`,
              `${r.attendance_attended}/${r.attendance_total}`,
              r.latest_progress || '—',
              r.latest_training_title || '—',
              r.evaluation_count,
            ])}
          />
        </>
      )}

      {!loading && tab === 'Evaluations' && tabReport?.summary && (
        <>
          <div className="surface-card max-w-xs p-5">
            <div className="text-xs text-slate-500">Total evaluations</div>
            <div className="mt-2 text-2xl font-bold">{tabReport.summary.total ?? 0}</div>
          </div>
          <ReportTable
            headers={['Participant', 'Training', 'Progress', 'Remarks', 'Achievements', 'Follow-up', 'Date']}
            rows={(tabReport.rows || []).map((r) => [
              r.participant_name,
              r.training_title || '—',
              r.progress,
              r.remarks || '—',
              r.achievements || '—',
              r.follow_up || '—',
              formatDateTime(r.created_at),
            ])}
          />
        </>
      )}
      </div>
    </div>
  );
}

function ReportTable({ headers, rows }) {
  return (
        <div className="surface-card overflow-x-auto p-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            {headers.map((h) => <th key={h} className="py-2 pr-4">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b last:border-0">
              {row.map((cell, cellIdx) => <td key={cellIdx} className="py-3 pr-4 align-top">{cell}</td>)}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="py-4 text-slate-500">No records match the selected filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
