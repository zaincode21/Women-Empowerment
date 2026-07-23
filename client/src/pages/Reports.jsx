import { useEffect, useState } from 'react';
import {
  getAttendanceReport,
  getEvaluationsReport,
  getParticipants,
  getProgressReport,
  getSummary,
  getTrainings,
  getTrainingsReport,
  getTrainers,
} from '../lib/api';
import { downloadCsv } from '../lib/export';
import { ProgramAnalytics } from '../components/ProgramAnalytics';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { inputClassName, selectClassName } from '../components/ui/Field';

const TABS = ['Summary', 'Attendance', 'Trainings', 'Progress', 'Evaluations'];

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

  const [attendanceFilters, setAttendanceFilters] = useState({ training_id: '', participant_id: '', from: '', to: '' });
  const [trainingsFilters, setTrainingsFilters] = useState({ trainer_id: '', from: '', to: '' });
  const [progressFilters, setProgressFilters] = useState({ participant_id: '' });
  const [evaluationFilters, setEvaluationFilters] = useState({ participant_id: '', from: '', to: '' });

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

  useEffect(() => {
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

  function exportSummaryCsv() {
    const data = tabReport || summary;
    downloadCsv('summary-report.csv', [
      ['Metric', 'Value'],
      ['Participants', data?.participants ?? 0],
      ['Trainings', data?.trainings ?? 0],
      ['Attendance', data?.attendance ?? 0],
      ['Evaluations', data?.evaluations ?? 0],
      [],
      ['Month', 'Participants', 'Trainings', 'Attendance', 'Evaluations'],
      ...trends.map((row) => [row.month, row.participants, row.trainings, row.attendance, row.evaluations]),
    ]);
  }

  function exportAttendanceCsv() {
    if (!tabReport?.rows) return;
    downloadCsv('attendance-report.csv', [
      ['Participant', 'Training', 'Status', 'Date'],
      ...tabReport.rows.map((r) => [r.participant_name, r.training_title, r.status, formatDateTime(r.created_at)]),
    ]);
  }

  function exportTrainingsCsv() {
    if (!tabReport?.rows) return;
    downloadCsv('trainings-report.csv', [
      ['Title', 'Trainer', 'Date', 'Location', 'Attendance records'],
      ...tabReport.rows.map((r) => [r.title, r.trainer_name, formatDate(r.date), r.location, r.attendance_count]),
    ]);
  }

  function exportProgressCsv() {
    if (!tabReport?.rows) return;
    downloadCsv('progress-report.csv', [
      ['Participant', 'Attendance rate', 'Sessions attended', 'Total sessions', 'Latest progress', 'Evaluations'],
      ...tabReport.rows.map((r) => [
        r.participant_name,
        `${r.attendance_rate}%`,
        r.attendance_attended,
        r.attendance_total,
        r.latest_progress || '',
        r.evaluation_count,
      ]),
    ]);
  }

  function exportEvaluationsCsv() {
    if (!tabReport?.rows) return;
    downloadCsv('evaluations-report.csv', [
      ['Participant', 'Progress', 'Remarks', 'Achievements', 'Follow-up', 'Date'],
      ...tabReport.rows.map((r) => [
        r.participant_name,
        r.progress,
        r.remarks || '',
        r.achievements || '',
        r.follow_up || '',
        formatDateTime(r.created_at),
      ]),
    ]);
  }

  function handleExport() {
    if (tab === 'Summary') exportSummaryCsv();
    else if (tab === 'Attendance') exportAttendanceCsv();
    else if (tab === 'Trainings') exportTrainingsCsv();
    else if (tab === 'Progress') exportProgressCsv();
    else if (tab === 'Evaluations') exportEvaluationsCsv();
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Reports"
        description="Generate filtered reports and export program data."
      >
        <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
        <Button onClick={() => window.print()}>Print / PDF</Button>
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
            {name}
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
          <FilterField label="From">
            <input type="date" className={inputClassName()} value={evaluationFilters.from} onChange={(e) => setEvaluationFilters({ ...evaluationFilters, from: e.target.value })} />
          </FilterField>
          <FilterField label="To">
            <input type="date" className={inputClassName()} value={evaluationFilters.to} onChange={(e) => setEvaluationFilters({ ...evaluationFilters, to: e.target.value })} />
          </FilterField>
        </FilterBar>
      )}

      {loading && <div className="text-sm text-slate-500">Loading report…</div>}

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
            headers={['Participant', 'Attendance', 'Sessions', 'Latest progress', 'Evaluations']}
            rows={(tabReport.rows || []).map((r) => [
              r.participant_name,
              `${r.attendance_rate}%`,
              `${r.attendance_attended}/${r.attendance_total}`,
              r.latest_progress || '—',
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
            headers={['Participant', 'Progress', 'Remarks', 'Achievements', 'Follow-up', 'Date']}
            rows={(tabReport.rows || []).map((r) => [
              r.participant_name,
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
