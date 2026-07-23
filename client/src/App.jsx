import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RequireRole from './components/RequireRole';
import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import Trainers from './pages/Trainers';
import Trainings from './pages/Trainings';
import Attendance from './pages/Attendance';
import Evaluations from './pages/Evaluations';
import Monitoring from './pages/Monitoring';
import ParticipantProfile from './pages/ParticipantProfile';
import Reports from './pages/Reports';
import CertificateGenerator from './pages/CertificateGenerator';
import Users from './pages/Users';
import Login from './pages/Login';

function RequireAuth({ children }) {
  const user = JSON.parse(localStorage.getItem('we_user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<RequireRole module="dashboard"><Dashboard /></RequireRole>} />
          <Route path="participants" element={<RequireRole module="participants"><Participants /></RequireRole>} />
          <Route path="trainers" element={<RequireRole module="trainers"><Trainers /></RequireRole>} />
          <Route path="trainings" element={<RequireRole module="trainings"><Trainings /></RequireRole>} />
          <Route path="attendance" element={<RequireRole module="attendance"><Attendance /></RequireRole>} />
          <Route path="evaluations" element={<RequireRole module="evaluations"><Evaluations /></RequireRole>} />
          <Route path="monitoring" element={<RequireRole module="monitoring"><Monitoring /></RequireRole>} />
          <Route path="monitoring/:id" element={<RequireRole module="monitoring"><ParticipantProfile /></RequireRole>} />
          <Route path="reports" element={<RequireRole module="reports"><Reports /></RequireRole>} />
          <Route path="certificates" element={<RequireRole module="certificates"><CertificateGenerator /></RequireRole>} />
          <Route path="users" element={<RequireRole module="users"><Users /></RequireRole>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-slate-100">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            className="touch-target rounded-xl p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="text-sm font-semibold text-slate-900">Women Empowerment</div>
          <div className="w-10" />
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
