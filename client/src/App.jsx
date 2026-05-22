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
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
