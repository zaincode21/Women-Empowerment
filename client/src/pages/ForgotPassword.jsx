import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../lib/api';
import { BackgroundDecor, ShieldIcon } from './authShared';
import { inputClassName } from '../components/ui/Field';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary-50 via-slate-50 to-primary-100/80 px-4 py-10">
      <BackgroundDecor />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200/80">
        <div className="mb-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
            <ShieldIcon /> Password recovery
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Forgot password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your account email to get a reset link.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {result.message}
            </div>
            {result.resetUrl && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="font-medium text-slate-800">Demo reset link</p>
                <a href={result.resetUrl} className="mt-1 block break-all text-primary-600 hover:underline">
                  {result.resetUrl}
                </a>
              </div>
            )}
            <Link to="/login" className="block text-center text-sm font-semibold text-primary-600 hover:text-primary-700">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClassName()}
                placeholder="name@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center text-sm text-slate-600">
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
