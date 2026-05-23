import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import Trainers from './pages/Trainers';
import Trainings from './pages/Trainings';
import Attendance from './pages/Attendance';
import Evaluations from './pages/Evaluations';
import Reports from './pages/Reports';
import Login from './pages/Login';

function RequireAuth({ children }) {
  const user = JSON.parse(localStorage.getItem('we_user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="participants" element={<Participants />} />
          <Route path="trainers" element={<Trainers />} />
          <Route path="trainings" element={<Trainings />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1">
        <header className="md:hidden bg-white border-b p-3 flex items-center justify-between">
          <button className="p-2 rounded-md" onClick={() => setOpen(true)} aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="text-lg font-semibold">Women Empowerment</div>
          <div />
        </header>
        <main className="p-0 md:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
