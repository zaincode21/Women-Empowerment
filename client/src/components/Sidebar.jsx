import { NavLink } from 'react-router-dom';
import { getUser } from '../lib/auth';
import { canAccess } from '../lib/permissions';
import { NavIcon } from '../lib/navIcons';
import Button from './ui/Button';

const ALL_LINKS = [
  { to: '/', label: 'Dashboard', module: 'dashboard', icon: 'dashboard' },
  { to: '/participants', label: 'Participants', module: 'participants', icon: 'participants' },
  { to: '/trainers', label: 'Trainers', module: 'trainers', icon: 'trainers' },
  { to: '/trainings', label: 'Trainings', module: 'trainings', icon: 'trainings' },
  { to: '/attendance', label: 'Attendance', module: 'attendance', icon: 'attendance' },
  { to: '/evaluations', label: 'Evaluations', module: 'evaluations', icon: 'evaluations' },
  { to: '/monitoring', label: 'Monitoring', module: 'monitoring', icon: 'monitoring' },
  { to: '/reports', label: 'Reports', module: 'reports', icon: 'reports' },
  { to: '/certificates', label: 'Certificates', module: 'certificates', icon: 'certificates' },
  { to: '/users', label: 'Users', module: 'users', icon: 'users' },
];

function formatRole(role) {
  return role?.replace(/_/g, ' ') || '';
}

function logout() {
  localStorage.removeItem('we_user');
  localStorage.removeItem('we_token');
  window.location.href = '/login';
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-sm">
        WE
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-slate-900">Women Empowerment</div>
        <div className="text-xs text-slate-500">Monitoring & Evaluation</div>
      </div>
    </div>
  );
}

function UserCard({ user }) {
  if (!user) return null;
  const initial = user.username?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-900">{user.username}</div>
          <div className="truncate text-xs capitalize text-slate-500">{formatRole(user.role)}</div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open = false, onClose = () => {} }) {
  const user = getUser();
  const links = ALL_LINKS.filter((l) => canAccess(l.module, 'read'));

  function NavLinks({ onItemClick }) {
    return (
      <nav className="space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            onClick={onItemClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'nav-pill-active' : 'nav-pill-inactive'}`
            }
          >
            <NavIcon name={l.icon} className="h-5 w-5 shrink-0 opacity-80" />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    );
  }

  const shell = (mobile = false) => (
    <div className="flex h-full flex-col">
      <div className={`mb-6 flex items-center justify-between ${mobile ? 'px-1' : ''}`}>
        <Brand />
        {mobile && (
          <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <NavLinks onItemClick={mobile ? onClose : undefined} />
      </div>

      <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
        <UserCard user={user} />
        <Button variant="danger" className="w-full" onClick={logout}>Sign out</Button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-full w-72 shrink-0 border-r border-slate-200/80 bg-white md:flex md:flex-col">
        <div className="flex h-full flex-col px-4 py-6">{shell(false)}</div>
      </aside>

      <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
        <aside className={`absolute bottom-0 left-0 top-0 w-[min(20rem,88vw)] bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-full flex-col px-4 py-6">{shell(true)}</div>
        </aside>
      </div>
    </>
  );
}
