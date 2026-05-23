import { NavLink } from 'react-router-dom';

export default function Sidebar({ open = false, onClose = () => {} }) {
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/participants', label: 'Participants' },
    { to: '/trainers', label: 'Trainers' },
    { to: '/trainings', label: 'Trainings' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/evaluations', label: 'Evaluations' },
    { to: '/reports', label: 'Reports' },
  ];

  // Desktop sidebar
  const desktop = (
    <aside className="hidden md:block w-64 shrink-0 border-r bg-white/90">
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
          <button className="w-full rounded-md bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700" onClick={() => { localStorage.removeItem('we_user'); localStorage.removeItem('we_token'); window.location.href = '/login'; }}>Logout</button>
        </div>
      </div>
    </aside>
  );

  // Mobile slide-over
  const mobile = (
    <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute left-0 top-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col py-6 px-4">
          <div className="mb-6 px-2 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-slate-900">Women Empowerment</div>
              <div className="text-xs text-slate-500">Monitoring & Evaluation</div>
            </div>
            <button className="text-sm text-slate-500" onClick={onClose}>Close</button>
          </div>
          <nav className="flex-1 space-y-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end onClick={onClose} className={({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 px-2">
            <button className="w-full rounded-md bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700" onClick={() => { localStorage.removeItem('we_user'); localStorage.removeItem('we_token'); window.location.href = '/login'; }}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {desktop}
      {mobile}
    </>
  );
}
