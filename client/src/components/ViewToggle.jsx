import { selectClassName } from './ui/Field';

export default function ViewToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm">
      <span className="pl-1 text-xs font-medium text-slate-500">View</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${selectClassName('border-0 bg-transparent py-1.5 shadow-none focus:ring-0')} min-w-[88px]`}>
        <option value="auto">Auto</option>
        <option value="table">Table</option>
        <option value="cards">Cards</option>
      </select>
    </div>
  );
}
