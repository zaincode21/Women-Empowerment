import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicTrainings, registerParticipant } from '../lib/api';
import TrainingPicker from '../components/TrainingPicker';
import { Field, inputClassName } from '../components/ui/Field';
import { ArrowRightIcon, BackgroundDecor, LockIcon, ShieldIcon, EyeIcon, EyeOffIcon } from './authShared';

const STEPS = [
  { id: 1, label: 'Your details' },
  { id: 2, label: 'Choose trainings' },
  { id: 3, label: 'Password' },
];

const empty = {
  full_name: '',
  age: '',
  date_of_birth: '',
  village: '',
  cell: '',
  sector: '',
  district: '',
  province: '',
  address: '',
  phone_number: '',
  email: '',
  education_level: '',
  occupation: '',
};

export default function ParticipantRegister() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [trainingIds, setTrainingIds] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPublicTrainings().then(setTrainings).catch(() => setTrainings([]));
  }, []);

  function validateStep(currentStep) {
    if (currentStep === 1) {
      if (!form.full_name.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (!form.education_level) {
        setError('Please select your education level.');
        return false;
      }
    }
    if (currentStep === 2 && trainingIds.length === 0) {
      setError('Please select at least one training.');
      return false;
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
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const data = await registerParticipant({ ...form, password, training_ids: trainingIds });
      setSuccess(data.message || 'Registration submitted. Wait for staff approval before signing in.');
      setForm(empty);
      setPassword('');
      setConfirmPassword('');
      setTrainingIds([]);
      setStep(1);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const isLastStep = step === STEPS.length;

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary-50 via-slate-50 to-primary-100/80 px-4 py-10 sm:px-6">
      <BackgroundDecor />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,94,84,0.25)] ring-1 ring-slate-200/80">
        <div className="flex min-h-[600px] flex-col lg:flex-row">
          <section className="flex flex-1 flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white sm:p-10 lg:max-w-[48%]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                <ShieldIcon />
                Program registration
              </div>
              <h1 className="mt-8 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Register as a program participant
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-primary-100/95 sm:text-base">
                Share your details, choose trainings, and set a password to access your account.
              </p>
            </div>
            <div className="mt-10 space-y-3">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl border px-4 py-3 ${
                    step === s.id ? 'border-white/30 bg-white/15' : 'border-white/5 bg-white/5 opacity-80'
                  }`}
                >
                  <div className="text-sm font-semibold">Step {s.id}: {s.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-1 flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 lg:max-w-[52%]">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Participant registration</h2>
                <p className="mt-1 text-sm text-slate-500">Step {step} of {STEPS.length}</p>
              </div>

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

              <form onSubmit={isLastStep ? submit : (e) => { e.preventDefault(); goNext(); }} className="space-y-4">
                {step === 1 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="Full name" htmlFor="full_name">
                        <input id="full_name" required placeholder="Your full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClassName()} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Email" htmlFor="email">
                        <input id="email" required type="email" placeholder="name@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClassName()} />
                      </Field>
                    </div>
                    <Field label="Age" htmlFor="age">
                      <input id="age" type="number" min="0" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={inputClassName()} />
                    </Field>
                    <Field label="Date of birth" htmlFor="date_of_birth">
                      <input id="date_of_birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className={inputClassName()} />
                    </Field>
                    <Field label="Phone" htmlFor="phone_number">
                      <input id="phone_number" required placeholder="e.g. 0788000000" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className={inputClassName()} />
                    </Field>
                    <Field label="Education level" htmlFor="education_level">
                      <select id="education_level" required value={form.education_level} onChange={(e) => setForm({ ...form, education_level: e.target.value })} className={inputClassName()}>
                        <option value="">Select education level</option>
                        <option>No formal education</option>
                        <option>Primary</option>
                        <option>Ordinary Level</option>
                        <option>Advanced Level</option>
                        <option>TVET / Vocational</option>
                        <option>University</option>
                      </select>
                    </Field>
                    <Field label="Occupation" htmlFor="occupation">
                      <input id="occupation" placeholder="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputClassName()} />
                    </Field>
                    <Field label="Village" htmlFor="village">
                      <input id="village" placeholder="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className={inputClassName()} />
                    </Field>
                    <Field label="Cell" htmlFor="cell">
                      <input id="cell" placeholder="Cell" value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} className={inputClassName()} />
                    </Field>
                    <Field label="Sector" htmlFor="sector">
                      <input id="sector" placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClassName()} />
                    </Field>
                    <Field label="District" htmlFor="district">
                      <input id="district" placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={inputClassName()} />
                    </Field>
                    <Field label="Province" htmlFor="province">
                      <input id="province" placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className={inputClassName()} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Address" htmlFor="address">
                        <input id="address" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClassName()} />
                      </Field>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <Field label="Trainings">
                    <TrainingPicker
                      trainings={trainings}
                      selectedIds={trainingIds}
                      onChange={setTrainingIds}
                      required
                    />
                  </Field>
                )}

                {step === 3 && (
                  <>
                    <div className="rounded-lg border border-primary-100 bg-primary-50/50 px-4 py-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-800">Almost done</p>
                      <p className="mt-1">Create a password to protect your participant account.</p>
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
                    <button type="button" onClick={goBack} disabled={loading} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Back
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                    {loading ? 'Submitting…' : isLastStep ? 'Submit registration' : 'Continue'}
                    {!loading && !isLastStep && <ArrowRightIcon />}
                  </button>
                </div>
              </form>

              <p className="mt-8 text-center text-sm text-slate-600">
                Staff login?{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
