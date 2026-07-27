import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/authStorage';
import {
  ArrowRightIcon,
  BackgroundDecor,
  LockIcon,
  ShieldIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
} from './authShared';
import { inputClassName } from '../components/ui/Field';

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'project_manager', label: 'Project Manager' },
];

const STEPS = [
  { id: 1, label: 'Personal info', short: 'Personal' },
  { id: 2, label: 'Account', short: 'Account' },
  { id: 3, label: 'Security', short: 'Security' },
];

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function RegisterStepper({ step }) {
  return (
    <nav aria-label="Registration progress" className="mb-8">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((s, index) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    done
                      ? 'bg-primary-600 text-white'
                      : active
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? <CheckIcon /> : s.id}
                </div>
                <span
                  className={`hidden text-center text-xs font-medium sm:block ${
                    active ? 'text-primary-700' : done ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
                <span
                  className={`text-center text-xs font-medium sm:hidden ${
                    active ? 'text-primary-700' : done ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.short}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-1 mb-6 h-0.5 flex-1 rounded-full sm:mb-5 ${
                    step > s.id ? 'bg-primary-500' : 'bg-slate-200'
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  function validateStep(currentStep) {
    if (currentStep === 1) {
      if (fullName.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return false;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    return true;
  }

  function goNext() {
    setError('');
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          role,
          full_name: fullName,
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setSuccess('Account created successfully. You can sign in now.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === role)?.label || role;

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary-50 via-slate-50 to-primary-100/80 px-4 py-10 sm:px-6">
      <BackgroundDecor />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,94,84,0.25)] ring-1 ring-slate-200/80">
        <div className="flex min-h-[600px] flex-col lg:flex-row">
          <section className="flex flex-1 flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white sm:p-10 lg:max-w-[48%]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                <ShieldIcon />
                Join the program team
              </div>

              <h1 className="mt-8 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Create your workspace account
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-primary-100/95 sm:text-base">
                Complete the steps to register. Your information is saved as you progress through
                personal details, account setup, and security.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    step === s.id
                      ? 'border-white/30 bg-white/15'
                      : step > s.id
                        ? 'border-white/10 bg-white/5'
                        : 'border-white/5 bg-white/5 opacity-60'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      step > s.id ? 'bg-white text-primary-700' : step === s.id ? 'bg-white text-primary-700' : 'bg-white/20 text-white'
                    }`}
                  >
                    {step > s.id ? <CheckIcon className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="text-xs text-primary-100/80">
                      {s.id === 1 && 'Name and contact details'}
                      {s.id === 2 && 'Username and program role'}
                      {s.id === 3 && 'Password and confirmation'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-1 flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 lg:max-w-[52%]">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white shadow-md shadow-primary-600/30">
                  WE
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary-700">
                  Women Empowerment Programme
                </p>
                <h2 className="mt-4 text-2xl font-bold text-slate-900">Register</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Step {step} of {STEPS.length} — {STEPS[step - 1].label}
                </p>
              </div>

              <RegisterStepper step={step} />

              {error && (
                <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
                  {success}
                </div>
              )}

              <form onSubmit={step === 3 ? submit : (e) => { e.preventDefault(); goNext(); }} className="space-y-4">
                {step === 1 && (
                  <>
                    <div>
                      <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Full name
                      </label>
                      <input
                        id="fullName"
                        autoComplete="name"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={inputClassName()}
                        minLength={2}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClassName()}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Phone number <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <input
                        id="phoneNumber"
                        type="tel"
                        autoComplete="tel"
                        placeholder="e.g. 0788000000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={inputClassName()}
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
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
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          minLength={3}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Role
                      </label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className={inputClassName()}
                        required
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-800">Summary so far</p>
                      <p className="mt-1">{fullName}</p>
                      {email && <p className="text-slate-500">{email}</p>}
                      {phoneNumber && <p className="text-slate-500">{phoneNumber}</p>}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="rounded-lg border border-primary-100 bg-primary-50/50 px-4 py-3 text-sm">
                      <p className="font-medium text-slate-800">Review your account</p>
                      <dl className="mt-2 space-y-1 text-slate-600">
                        <div className="flex justify-between gap-4">
                          <dt>Name</dt>
                          <dd className="font-medium text-slate-900">{fullName}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt>Username</dt>
                          <dd className="font-medium text-slate-900">{username}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt>Role</dt>
                          <dd className="font-medium text-slate-900">{roleLabel}</dd>
                        </div>
                      </dl>
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
                          autoComplete="new-password"
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          minLength={6}
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

                    <div>
                      <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Confirm password
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <LockIcon />
                        </span>
                        <input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={loading}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
                  >
                    {loading
                      ? 'Creating account…'
                      : step === 3
                        ? 'Create account'
                        : 'Continue'}
                    {!loading && step < 3 && <ArrowRightIcon />}
                    {!loading && step === 3 && <ArrowRightIcon />}
                  </button>
                </div>
              </form>

              <p className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                  Sign in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
