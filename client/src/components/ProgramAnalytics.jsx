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
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message }) {
  return <div className="flex h-64 items-center justify-center text-sm text-slate-500">{message}</div>;
}

function DeltaBadge({ value, unit = '%' }) {
  if (value === null || value === undefined) return null;
  const positive = value > 0;
  const neutral = value === 0;
  const color = neutral
    ? 'bg-slate-100 text-slate-600'
    : positive
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-rose-50 text-rose-700';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {positive ? '+' : ''}{value}{unit}
    </span>
  );
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

export function PeriodComparisonCards({ comparison }) {
  if (!comparison?.current || !comparison?.previous) return null;
  const { current, previous, deltas } = comparison;
  const metrics = [
    { label: 'Participants', value: current.participants, previous: previous.participants, delta: deltas.participants, unit: '%' },
    { label: 'Trainings', value: current.trainings, previous: previous.trainings, delta: deltas.trainings, unit: '%' },
    { label: 'Attendance', value: current.attendance, previous: previous.attendance, delta: deltas.attendance, unit: '%' },
    { label: 'Attendance rate', value: `${current.attendanceRate}%`, previous: `${previous.attendanceRate}%`, delta: deltas.attendanceRate, unit: ' pts' },
  ];

  return (
    <ChartCard
      title="Period vs period"
      subtitle={`${current.label} compared with ${previous.label}`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-slate-500">{metric.label}</div>
              <DeltaBadge value={metric.delta} unit={metric.unit} />
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900">{metric.value}</div>
            <div className="mt-1 text-xs text-slate-500">Prev: {metric.previous}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Previous month — participants {previous.participants}, trainings {previous.trainings},
        attendance {previous.attendance}, evaluations {previous.evaluations}, rate {previous.attendanceRate}%.
      </p>
    </ChartCard>
  );
}

export function DistrictComparisonChart({ data = [] }) {
  const chartData = data.map((row) => ({
    name: row.district?.length > 14 ? `${row.district.slice(0, 14)}…` : row.district,
    fullName: row.district,
    rate: row.attendance_rate,
    participants: row.participants,
  }));

  return (
    <ChartCard title="Attendance by district" subtitle="Compare participation quality across locations">
      {chartData.length === 0 ? (
        <EmptyChart message="No district data yet." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip
              formatter={(value, _name, props) => [`${value}% (${props.payload.participants} participants)`, 'Attendance']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
            />
            <Bar dataKey="rate" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function TrainerPerformanceChart({ data = [] }) {
  const chartData = data.map((row) => ({
    name: row.trainer_name?.length > 16 ? `${row.trainer_name.slice(0, 16)}…` : row.trainer_name,
    fullName: row.trainer_name,
    rate: row.attendance_rate,
    trainings: row.trainings,
    evaluations: row.evaluations,
  }));

  return (
    <ChartCard title="Trainer performance" subtitle="Attendance rate and evaluation volume by trainer">
      {chartData.length === 0 ? (
        <EmptyChart message="No trainer performance data yet." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value, _name, props) => [
                `${value}% · ${props.payload.trainings} trainings · ${props.payload.evaluations} evaluations`,
                'Attendance rate',
              ]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
            />
            <Bar dataKey="rate" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

const insightStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

export function DecisionInsights({ insights = [] }) {
  if (!insights.length) return null;
  return (
    <ChartCard title="Decision insights" subtitle="Actionable signals from attendance, districts, and trainers">
      <ul className="space-y-2">
        {insights.map((item, idx) => (
          <li
            key={`${item.severity}-${idx}`}
            className={`rounded-lg border px-3 py-2 text-sm ${insightStyles[item.severity] || insightStyles.info}`}
          >
            <span className="mr-2 text-xs font-semibold uppercase tracking-wide opacity-70">{item.severity}</span>
            {item.text}
          </li>
        ))}
      </ul>
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

      <DecisionInsights insights={summary.insights || []} />
      <PeriodComparisonCards comparison={summary.periodComparison} />

      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyTrendChart trends={summary.trends || []} />
        <AttendanceByTrainingChart data={summary.attendanceByTraining || []} />
        <DistrictComparisonChart data={summary.attendanceByDistrict || []} />
        <TrainerPerformanceChart data={summary.trainerPerformance || []} />
        <EducationPieChart data={summary.participantsByEducation || []} />
        <EvaluationsTrendChart trends={summary.trends || []} />
      </div>
    </div>
  );
}
