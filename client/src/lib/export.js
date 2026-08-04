import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell ?? '';
          const text = String(value);
          if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
          return text;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** @param {{ title: string, subtitle?: string, orientation?: 'portrait' | 'landscape', sections: Array<{ heading: string, headers?: string[], rows: any[][], summaryLines?: string[] }> }} options */
export function downloadPdf({ title, subtitle, orientation = 'portrait', sections }) {
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(title, margin, y);
  y += 18;

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, margin, y);
    y += 16;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
  y += 14;

  sections.forEach((section, index) => {
    if (y > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(section.heading, margin, y);
    y += 10;

    if (section.summaryLines?.length) {
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      section.summaryLines.forEach((line) => {
        doc.text(String(line), margin, y);
        y += 12;
      });
      y += 4;
    }

    if (section.headers?.length) {
      autoTable(doc, {
        startY: y,
        head: [section.headers],
        body: section.rows.map((row) => row.map((cell) => (cell == null || cell === '' ? '—' : String(cell)))),
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [13, 148, 136], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = (doc.lastAutoTable?.finalY || y) + 18;
    } else if (index < sections.length - 1) {
      y += 10;
    }
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${stamp}.pdf`);
}

/** @param {{ filename: string, sheets: Array<{ name: string, rows: any[][] }> }} options */
export function downloadExcel({ filename, sheets }) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  });
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`, new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }));
}

export function snapshotToExportSections(snapshot) {
  const summary = snapshot.summary || {};
  const metrics = summary.metrics || {};
  const comparison = summary.periodComparison || {};
  const current = comparison.current || {};
  const previous = comparison.previous || {};
  const deltas = comparison.deltas || {};

  return {
    title: `Program Report — ${snapshot.period_label}`,
    subtitle: `${snapshot.period_type} · ${snapshot.period_start} to ${snapshot.period_end} · generated ${new Date(snapshot.created_at).toLocaleString()}`,
    sections: [
      {
        heading: 'Period metrics',
        summaryLines: [
          `Participants registered: ${metrics.participants ?? 0}`,
          `Trainings created: ${metrics.trainings ?? 0}`,
          `Attendance records: ${metrics.attendance ?? 0}`,
          `Attendance rate: ${metrics.attendanceRate ?? 0}%`,
          `Evaluations: ${metrics.evaluations ?? 0}`,
          `Program completion: ${metrics.programCompletionRate ?? 0}%`,
        ],
        headers: ['Metric', 'Value'],
        rows: [
          ['Participants', metrics.participants ?? 0],
          ['Trainings', metrics.trainings ?? 0],
          ['Attendance', metrics.attendance ?? 0],
          ['Attendance rate', `${metrics.attendanceRate ?? 0}%`],
          ['Evaluations', metrics.evaluations ?? 0],
          ['Program completion', `${metrics.programCompletionRate ?? 0}%`],
        ],
      },
      {
        heading: 'Period comparison',
        headers: ['Metric', previous.label || 'Previous', current.label || 'Current', 'Change'],
        rows: [
          ['Participants', previous.participants ?? 0, current.participants ?? 0, `${deltas.participants ?? 0}%`],
          ['Trainings', previous.trainings ?? 0, current.trainings ?? 0, `${deltas.trainings ?? 0}%`],
          ['Attendance', previous.attendance ?? 0, current.attendance ?? 0, `${deltas.attendance ?? 0}%`],
          ['Evaluations', previous.evaluations ?? 0, current.evaluations ?? 0, `${deltas.evaluations ?? 0}%`],
          ['Attendance rate', `${previous.attendanceRate ?? 0}%`, `${current.attendanceRate ?? 0}%`, `${deltas.attendanceRate ?? 0} pts`],
        ],
      },
      {
        heading: 'District performance',
        headers: ['District', 'Participants', 'Attendance rate', 'Records'],
        rows: (summary.attendanceByDistrict || []).map((d) => [
          d.district,
          d.participants,
          `${d.attendance_rate}%`,
          d.attendance_total,
        ]),
      },
      {
        heading: 'Trainer performance',
        headers: ['Trainer', 'Trainings', 'Attendance rate', 'Evaluations'],
        rows: (summary.trainerPerformance || []).map((t) => [
          t.trainer_name,
          t.trainings,
          `${t.attendance_rate}%`,
          t.evaluations,
        ]),
      },
      {
        heading: 'Insights',
        headers: ['Severity', 'Insight'],
        rows: (summary.insights || []).map((i) => [i.severity, i.text]),
      },
    ],
  };
}
