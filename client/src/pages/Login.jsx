import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setToken, setUser, clearLegacyAuth } from '../lib/authStorage';
import {
  ArrowRightIcon,
  BackgroundDecor,
  LockIcon,
  ShieldIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
} from './authShared';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Invalid email or password');
      }
      const data = await res.json();
      clearLegacyAuth();
      setToken(data.token);
      setUser(data.user || { email, role: 'staff' });
      navigate(data.user?.role === 'participant' ? '/portal' : '/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary-50 via-slate-50 to-primary-100/80 px-4 py-10 sm:px-6">
      <BackgroundDecor />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,94,84,0.25)] ring-1 ring-slate-200/80">
        <div className="flex min-h-[560px] flex-col lg:flex-row">
          {/* Left — brand panel */}
          <section className="flex flex-1 flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white sm:p-10 lg:max-w-[48%]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                <ShieldIcon />
                Secure program monitoring
              </div>

              <h1 className="mt-8 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Welcome to the Women Empowerment Monitoring System
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-primary-100/95 sm:text-base">
                Track participants, trainings, attendance, and evaluations in one secure workspace.
                Built for field teams, trainers, and program managers working to empower women
                through skills development and measurable impact.
              </p>
            </div>

            <div className="mt-10 rounded-xl border border-white/15 bg-primary-800/50 p-5 backdrop-blur-sm">
              <p className="text-sm leading-relaxed text-primary-50/90">
                Register participants, record session attendance, monitor progress, generate
                reports, and issue certificates — with role-based access for administrators,
                project managers, trainers, and staff.
              </p>
            </div>
          </section>

          {/* Right — sign-in form */}
          <section className="flex flex-1 flex-col justify-center bg-white p-8 sm:p-10 lg:max-w-[52%]">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white shadow-md shadow-primary-600/30">
                  WE
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary-700">
                  Women Empowerment Programme
                </p>
                <h2 className="mt-4 text-2xl font-bold text-slate-900">Sign in</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Access your empowerment program workspace
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <UserIcon />
                    </span>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LockIcon />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <p className="text-center text-xs text-slate-500">
                  Your session ends when you close this browser.
                </p>

                <div className="text-right text-sm">
                  <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                  {!loading && <ArrowRightIcon />}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-600">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                  Register staff
                </Link>
              </p>

              <p className="mt-3 text-center text-sm text-slate-600">
                Joining as a participant?{' '}
                <Link to="/participant-register" className="font-semibold text-primary-600 hover:text-primary-700">
                  Register for trainings
                </Link>
              </p>

              <p className="mt-4 text-center text-[11px] text-slate-400">
                Demo: admin@wep.rw / admin123 · pm1@wep.rw / demo123
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
