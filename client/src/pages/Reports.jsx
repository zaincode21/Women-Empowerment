import { useEffect, useState } from 'react';
import { getSummary } from '../lib/api';
import Sparkline from '../components/Sparkline';

function downloadText(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  useEffect(() => { getSummary().then(setSummary).catch(() => {}); }, []);

  const trends = summary?.trends || [];

  function exportCsv() {
    const rows = [
      ['Metric', 'Value'],
      ['Participants', summary?.participants ?? 0],
      ['Trainings', summary?.trainings ?? 0],
      ['Attendance', summary?.attendance ?? 0],
      ['Evaluations', summary?.evaluations ?? 0],
      [],
      ['Month', 'Participants', 'Trainings', 'Attendance', 'Evaluations'],
      ...trends.map((row) => [row.month, row.participants, row.trainings, row.attendance, row.evaluations]),
    ];
    downloadText('women-empowerment-reports.csv', rows.map((row) => row.join(',')).join('\n'), 'text/csv');
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-sm text-slate-500">Operational summary, trends, and export options</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-2 text-sm" onClick={exportCsv}>Export CSV</button>
          <button className="rounded bg-teal-600 px-3 py-2 text-sm text-white" onClick={printReport}>Print / Save PDF</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow">
          <div className="text-xs text-slate-500">Participants</div>
          <div className="mt-2 text-2xl font-bold">{summary?.participants ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow">
          <div className="text-xs text-slate-500">Trainings</div>
          <div className="mt-2 text-2xl font-bold">{summary?.trainings ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow">
          <div className="text-xs text-slate-500">Attendance</div>
          <div className="mt-2 text-2xl font-bold">{summary?.attendance ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow">
          <div className="text-xs text-slate-500">Evaluations</div>
          <div className="mt-2 text-2xl font-bold">{summary?.evaluations ?? 0}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow">
          <h3 className="font-semibold mb-3">Monthly trends</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-sm text-slate-500">Participants</div>
              <Sparkline data={trends.map((row) => row.participants)} width={420} height={60} />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">Trainings</div>
              <Sparkline data={trends.map((row) => row.trainings)} width={420} height={60} stroke="#0f766e" />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">Attendance</div>
              <Sparkline data={trends.map((row) => row.attendance)} width={420} height={60} stroke="#f59e0b" />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">Evaluations</div>
              <Sparkline data={trends.map((row) => row.evaluations)} width={420} height={60} stroke="#4f46e5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow">
          <h3 className="font-semibold mb-3">Trend table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">Month</th>
                  <th className="py-2 pr-3">Participants</th>
                  <th className="py-2 pr-3">Trainings</th>
                  <th className="py-2 pr-3">Attendance</th>
                  <th className="py-2 pr-3">Evaluations</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((row) => (
                  <tr key={row.month} className="border-t">
                    <td className="py-2 pr-3">{row.month}</td>
                    <td className="py-2 pr-3">{row.participants}</td>
                    <td className="py-2 pr-3">{row.trainings}</td>
                    <td className="py-2 pr-3">{row.attendance}</td>
                    <td className="py-2 pr-3">{row.evaluations}</td>
                  </tr>
                ))}
                {trends.length === 0 && (
                  <tr><td colSpan="5" className="py-3 text-slate-500">No trend data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
