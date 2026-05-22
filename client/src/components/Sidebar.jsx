import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/participants', label: 'Participants' },
    { to: '/trainers', label: 'Trainers' },
    { to: '/trainings', label: 'Trainings' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/evaluations', label: 'Evaluations' },
    { to: '/reports', label: 'Reports' },
  ];

  return (
    <aside className="w-64 shrink-0 border-r bg-white/90">
      <div className="h-full flex flex-col py-6 px-4">
        <div className="mb-6 px-2">
          <div className="text-lg font-bold text-slate-900">Women Empowerment</div>
          <div className="text-xs text-slate-500">Monitoring & Evaluation</div>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 px-2">
          <button className="w-full rounded-md bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700" onClick={() => { localStorage.removeItem('we_user'); window.location.href = '/login'; }}>Logout</button>
        </div>
      </div>
    </aside>
  );
}
