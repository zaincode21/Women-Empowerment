import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#0d9488', '#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#f59e0b', '#4f46e5', '#64748b'];

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="surface-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message }) {
  return <div className="flex h-64 items-center justify-center text-sm text-slate-500">{message}</div>;
}

export function MonthlyTrendChart({ trends = [] }) {
  const data = trends.map((row) => ({
    month: row.month,
    Participants: row.participants,
    Trainings: row.trainings,
    Attendance: row.attendance,
    Evaluations: row.evaluations,
  }));

  return (
    <ChartCard title="Monthly activity" subtitle="Registrations, sessions, and reviews over the last 6 months">
      {data.length === 0 ? (
        <EmptyChart message="No trend data yet." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Participants" fill="#0d9488" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Trainings" fill="#0f766e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Attendance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Evaluations" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function AttendanceByTrainingChart({ data = [] }) {
  const chartData = data.map((row) => ({
    name: row.title?.length > 18 ? `${row.title.slice(0, 18)}…` : row.title,
    fullTitle: row.title,
    rate: row.rate,
    attended: row.attended,
    total: row.total,
  }));

  return (
    <ChartCard title="Attendance by training" subtitle="Share of Present/Late sessions per program">
      {chartData.length === 0 ? (
        <EmptyChart message="No attendance data yet." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Attendance rate']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle || ''}
            />
            <Bar dataKey="rate" fill="#0d9488" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function EducationPieChart({ data = [] }) {
  const chartData = data.map((row) => ({ name: row.level, value: row.count }));

  return (
    <ChartCard title="Participants by education" subtitle="Distribution of registered education levels">
      {chartData.length === 0 ? (
        <EmptyChart message="No participant data yet." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function EvaluationsTrendChart({ trends = [] }) {
  const data = trends.map((row) => ({ month: row.month, Evaluations: row.evaluations }));

  return (
    <ChartCard title="Evaluation trend" subtitle="Progress reviews recorded each month">
      {data.length === 0 ? (
        <EmptyChart message="No evaluation trend data yet." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="Evaluations" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function ProgramAnalytics({ summary, showMetricCards = true }) {
  if (!summary) return null;

  return (
    <div className="space-y-6">
      {showMetricCards && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-card p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Program completion rate</div>
            <div className="mt-2 text-3xl font-bold text-primary-700">{summary.programCompletionRate ?? 0}%</div>
            <div className="mt-2 text-sm text-slate-500">
              {summary.completedPairs ?? 0} of {summary.trackedPairs ?? 0} participant-training pairs at 80%+ attendance
            </div>
          </div>
          <div className="surface-card p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Evaluations</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{summary.evaluations ?? 0}</div>
            <div className="mt-2 text-sm text-slate-500">Recorded progress reviews and follow-ups</div>
          </div>
          <div className="surface-card p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Trainings tracked</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{summary.attendanceByTraining?.length ?? 0}</div>
            <div className="mt-2 text-sm text-slate-500">Programs with attendance analytics</div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyTrendChart trends={summary.trends || []} />
        <AttendanceByTrainingChart data={summary.attendanceByTraining || []} />
        <EducationPieChart data={summary.participantsByEducation || []} />
        <EvaluationsTrendChart trends={summary.trends || []} />
      </div>
    </div>
  );
}
