import { useEffect, useState } from 'react';
import { createEvaluation, deleteEvaluation, getEvaluations, getParticipants, getTrainings, updateEvaluation } from '../lib/api';
import { canWrite } from '../lib/auth';
import Modal from '../components/Modal';
import ViewToggle from '../components/ViewToggle';
import Alert from '../components/Alert';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { RowActions, FormActions } from '../components/ui/RowActions';
import { inputClassName } from '../components/ui/Field';

const empty = { participant_id: '', training_id: '', progress: '', remarks: '', achievements: '', follow_up: '', next_review_at: '' };

function EvaluationCard({ e, writable, formatDateTime, onEdit, onDelete }) {
  const initial = e.participant_name?.charAt(0)?.toUpperCase() || '?';
  return (
    <article className="surface-card flex h-full flex-col p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{e.participant_name}</h3>
          <p className="mt-0.5 truncate text-xs text-primary-700">{e.training_title || 'No training linked'}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{e.progress || 'No progress noted'}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Achievements</dt>
          <dd className="line-clamp-2 text-slate-700">{e.achievements || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Follow-up</dt>
          <dd className="line-clamp-2 text-slate-700">{e.follow_up || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Remarks</dt>
          <dd className="line-clamp-2 text-slate-600">{e.remarks || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Date</dt>
          <dd className="text-slate-700">{formatDateTime(e.created_at)}</dd>
        </div>
      </dl>
      {writable && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <RowActions writable={writable} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
    </article>
  );
}

export default function Evaluations() {
  const [list, setList] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('cards');
  const [alert, setAlert] = useState(null);
  const writable = canWrite('evaluations');

  function formatDateTime(value) {
    if (!value) return '';
    try {
      const d = new Date(value);
      return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return String(value);
    }
  }

  async function refresh() {
    const [evaluations, parts, trains] = await Promise.all([
      getEvaluations(),
      getParticipants(),
      getTrainings(),
    ]);
    setList(evaluations);
    setParticipants(parts);
    setTrainings(trains);
  }

  useEffect(() => { refresh(); }, []);

  async function submit(e) {
    e.preventDefault();
    const payload = {
      participant_id: Number(form.participant_id),
      training_id: form.training_id ? Number(form.training_id) : null,
      progress: form.progress,
      remarks: form.remarks,
      achievements: form.achievements,
      follow_up: form.follow_up,
      next_review_at: form.next_review_at || null,
    };
    try {
      if (editingId) {
        await updateEvaluation(editingId, payload);
        setAlert({ type: 'success', message: 'Evaluation updated' });
      } else {
        await createEvaluation(payload);
        setAlert({ type: 'success', message: 'Evaluation created' });
      }
      setForm(empty);
      setEditingId(null);
      setOpen(false);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save evaluation' });
    }
  }

  function handleCreate() {
    setForm(empty);
    setEditingId(null);
    setOpen(true);
  }

  function handleEdit(e) {
    setForm({
      participant_id: String(e.participant_id),
      training_id: e.training_id ? String(e.training_id) : '',
      progress: e.progress || '',
      remarks: e.remarks || '',
      achievements: e.achievements || '',
      follow_up: e.follow_up || '',
      next_review_at: e.next_review_at ? e.next_review_at.slice(0, 16) : '',
    });
    setEditingId(e.id);
    setOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this evaluation?')) return;
    try {
      await deleteEvaluation(id);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete' });
    }
  }

  const columns = (
    <>
      <th className="p-3 border">Participant</th>
      <th className="p-3 border">Training</th>
      <th className="p-3 border">Progress</th>
      <th className="p-3 border">Achievements</th>
      <th className="p-3 border">Follow-up</th>
      <th className="p-3 border">Remarks</th>
      <th className="p-3 border">Date</th>
      {writable && <th className="p-3 border">Actions</th>}
    </>
  );

  function row(e) {
    return (
      <tr key={e.id} className="odd:bg-white even:bg-slate-50">
        <td className="p-3 border align-middle">{e.participant_name}</td>
        <td className="p-3 border align-middle">{e.training_title || '—'}</td>
        <td className="p-3 border align-middle">{e.progress}</td>
        <td className="p-3 border align-middle">{e.achievements}</td>
        <td className="p-3 border align-middle">{e.follow_up}</td>
        <td className="p-3 border align-middle">{e.remarks}</td>
        <td className="p-3 border align-middle">{formatDateTime(e.created_at)}</td>
        {writable && (
          <td className="p-3 border align-middle">
            <RowActions
              writable={writable}
              onEdit={() => handleEdit(e)}
              onDelete={() => handleDelete(e.id)}
            />
          </td>
        )}
      </tr>
    );
  }

  return (
    <div className="page-shell">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <PageHeader title="Evaluations" description="Record participant progress per training, achievements, and follow-up plans.">
        <ViewToggle value={view} onChange={setView} />
        {writable && <Button onClick={handleCreate}>Add evaluation</Button>}
      </PageHeader>

      <div className="page-body">
        {list.length === 0 ? (
          <EmptyState
            title="No evaluations yet"
            description="Create an evaluation to track participant progress in a training."
            action={writable ? <Button onClick={handleCreate}>Add evaluation</Button> : null}
          />
        ) : view === 'table' ? (
          <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead><tr className="bg-slate-50 text-left">{columns}</tr></thead>
                <tbody>{list.map(row)}</tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-4 content-start">
            {list.map((e) => (
              <EvaluationCard
                key={e.id}
                e={e}
                writable={writable}
                formatDateTime={formatDateTime}
                onEdit={() => handleEdit(e)}
                onDelete={() => handleDelete(e.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal title={editingId ? 'Edit evaluation' : 'Create evaluation'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <select required value={form.participant_id} onChange={(e) => setForm({ ...form, participant_id: e.target.value })} className={inputClassName()}>
            <option value="">Select participant</option>
            {participants.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <select value={form.training_id} onChange={(e) => setForm({ ...form, training_id: e.target.value })} className={inputClassName()}>
            <option value="">Training (optional)</option>
            {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <input required placeholder="Progress" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} className={inputClassName()} />
          <input placeholder="Achievements" value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} className={inputClassName()} />
          <input placeholder="Follow-up actions" value={form.follow_up} onChange={(e) => setForm({ ...form, follow_up: e.target.value })} className={inputClassName()} />
          <input type="datetime-local" placeholder="Next review" value={form.next_review_at} onChange={(e) => setForm({ ...form, next_review_at: e.target.value })} className={inputClassName()} />
          <textarea placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className={`sm:col-span-2 ${inputClassName()}`} />
          <FormActions
            onCancel={() => { setForm(empty); setEditingId(null); setOpen(false); }}
            submitLabel={editingId ? 'Update' : 'Save'}
          />
        </form>
      </Modal>
    </div>
  );
}
