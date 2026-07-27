export default function TrainingPicker({ trainings, selectedIds, onChange, required = true }) {
  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (!trainings.length) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        No trainings are available yet. Please contact the program office.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        Select one or more trainings {required ? '(required)' : '(optional)'}.
      </p>
      <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
        {trainings.map((t) => {
          const checked = selectedIds.includes(t.id);
          const when = t.start_date || t.date;
          return (
            <label
              key={t.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                checked ? 'border-primary-300 bg-primary-50' : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={checked}
                onChange={() => toggle(t.id)}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">{t.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {[t.trainer_name, when ? new Date(when).toLocaleDateString() : null, t.location]
                    .filter(Boolean)
                    .join(' · ') || 'Details to be announced'}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {required && selectedIds.length === 0 && (
        <p className="text-xs text-slate-500">Choose at least one training to continue.</p>
      )}
    </div>
  );
}
