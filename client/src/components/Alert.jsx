import { useEffect } from 'react';

export default function Alert({ type = 'info', message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bg = type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-rose-100' : 'bg-slate-100';
  const text = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-rose-700' : 'text-slate-800';

  return (
    <div className={`p-3 rounded ${bg} ${text} shadow-sm mb-4`} role="status">
      <div className="flex items-center justify-between">
        <div>{message}</div>
        <button className="ml-4 text-sm" onClick={() => onClose && onClose()}>Close</button>
      </div>
    </div>
  );
}
