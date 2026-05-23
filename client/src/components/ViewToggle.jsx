export default function ViewToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-600">View:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border p-1 text-sm">
        <option value="auto">Auto</option>
        <option value="table">Table</option>
        <option value="cards">Cards</option>
      </select>
    </div>
  );
}
