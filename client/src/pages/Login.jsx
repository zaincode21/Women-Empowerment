import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    (async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Login failed');
        }
        const data = await res.json();
        localStorage.setItem('we_token', data.token);
        localStorage.setItem('we_user', JSON.stringify(data.user || { username, role: 'staff' }));
        navigate('/');
      } catch (err) {
        alert('Login failed: ' + (err.message || 'unknown'));
      }
    })();
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="grid gap-3">
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="rounded border p-2" required />
        <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="rounded border p-2" required />
        <div>
          <button className="rounded bg-teal-600 px-4 py-2 text-white" type="submit">Login</button>
        </div>
      </form>
    </div>
  );
}
