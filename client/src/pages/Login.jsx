import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Staff');
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    // Frontend-only mock authentication
    const user = { username, role };
    localStorage.setItem('we_user', JSON.stringify(user));
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="grid gap-3">
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="rounded border p-2" required />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded border p-2">
          <option>Administrator</option>
          <option>Project Manager</option>
          <option>Trainer</option>
          <option>Staff</option>
        </select>
        <div>
          <button className="rounded bg-teal-600 px-4 py-2 text-white" type="submit">Login</button>
        </div>
      </form>
    </div>
  );
}
