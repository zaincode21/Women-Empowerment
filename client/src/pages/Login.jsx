import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ShieldIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function UserIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function LockIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function EyeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-primary-200/30 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-primary-300/25 blur-3xl" />
      <div className="absolute right-[12%] top-[8%] h-28 w-28 rounded-2xl border border-primary-200/40 bg-white/40 rotate-12" />
      <div className="absolute left-[8%] bottom-[18%] h-20 w-20 rounded-full border border-primary-300/30 bg-primary-50/50" />
      <svg className="absolute left-[6%] top-[12%] h-24 w-24 text-primary-300/25" viewBox="0 0 100 100" fill="none">
        <rect x="10" y="20" width="30" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
        <rect x="50" y="10" width="30" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
        <rect x="30" y="55" width="30" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M40 40 L50 30 M60 30 L65 55" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute bottom-[14%] right-[10%] h-20 w-20 text-primary-400/20" viewBox="0 0 80 60" fill="none">
        <rect x="8" y="8" width="64" height="44" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M8 44 L72 44" stroke="currentColor" strokeWidth="2" />
        <rect x="32" y="48" width="16" height="4" rx="1" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Invalid username or password');
      }
      const data = await res.json();
      localStorage.setItem('we_token', data.token);
      localStorage.setItem('we_user', JSON.stringify(data.user || { username, role: 'staff' }));
      if (remember) {
        localStorage.setItem('we_remember', '1');
      } else {
        localStorage.removeItem('we_remember');
      }
      navigate('/');
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
                  <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <UserIcon />
                    </span>
                    <input
                      id="username"
                      autoComplete="username"
                      placeholder="e.g. admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
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

                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    Remember me
                  </label>
                  <span className="text-slate-400">Forgot password?</span>
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

              <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
                Need access? Contact your program administrator.
              </div>

              <p className="mt-4 text-center text-[11px] text-slate-400">
                Demo: admin / admin123 · pm1 / demo123
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
