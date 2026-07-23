export function Field({ label, htmlFor, children, hint }) {
  return (
    <label className="grid gap-1.5 text-sm" htmlFor={htmlFor}>
      {label && <span className="font-medium text-slate-700">{label}</span>}
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function inputClassName(extra = '') {
  return `block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${extra}`;
}

export function selectClassName(extra = '') {
  return inputClassName(extra);
}
