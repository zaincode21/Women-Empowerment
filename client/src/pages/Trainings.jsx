import { useEffect, useState } from 'react';
import { createTraining, deleteTraining, getTrainings, getTrainers, updateTraining } from '../lib/api';
import { canWrite } from '../lib/auth';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ViewToggle from '../components/ViewToggle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { RowActions, FormActions } from '../components/ui/RowActions';
import { inputClassName } from '../components/ui/Field';
import { downloadPdf } from '../lib/export';

const empty = { title: '', trainer_id: '', trainer_name: '', start_date: '', end_date: '', village: '', cell: '', sector: '', district: '', province: '', location: '', description: '' };

function TrainingCard({ t, writable, onEdit, onDelete }) {
  const initial = t.title?.charAt(0)?.toUpperCase() || 'T';
  return (
    <article className="surface-card flex h-full flex-col p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold text-slate-900">{t.title}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">{t.trainer_name || 'No trainer'}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Date</dt>
          <dd className="font-medium text-slate-800">{t.date || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Location</dt>
          <dd className="truncate text-slate-700">{t.location || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Description</dt>
          <dd className="line-clamp-2 text-slate-600">{t.description || '—'}</dd>
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

export default function Trainings() {
  const [list, setList] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [view, setView] = useState('cards');
  const writable = canWrite('trainings');

  async function refresh() {
    setList(await getTrainings());
    setTrainers(await getTrainers());
  }
  useEffect(() => { refresh(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTraining(editingId, form);
        setAlert({ type: 'success', message: 'Training updated' });
      } else {
        await createTraining(form);
        setAlert({ type: 'success', message: 'Training created' });
      }
      setForm(empty);
      setEditingId(null);
      setOpen(false);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save training' });
    }
  }

  function handleCreate() {
    setForm(empty);
    setEditingId(null);
    setOpen(true);
  }

  function handleEdit(t) {
    const matchedTrainer = trainers.find((trainer) => trainer.full_name === t.trainer_name);
    setForm({ ...t, trainer_id: matchedTrainer?.id ? String(matchedTrainer.id) : '' });
    setEditingId(t.id);
    setOpen(true);
  }

  function handleTrainerChange(value) {
    const selectedTrainer = trainers.find((trainer) => String(trainer.id) === value);
    setForm({
      ...form,
      trainer_id: value,
      trainer_name: selectedTrainer?.full_name || '',
    });
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString();
  }

  function exportPdf() {
    downloadPdf({
      title: 'Trainings Report',
      subtitle: `${list.length} training${list.length === 1 ? '' : 's'} · Generated ${new Date().toLocaleString()}`,
      orientation: 'landscape',
      sections: [{
        heading: 'Training list',
        headers: ['Title', 'Trainer', 'Date', 'Location', 'District', 'Province', 'Description'],
        rows: list.map((t) => [
          t.title,
          t.trainer_name || '',
          formatDate(t.date || t.start_date),
          t.location || '',
          t.district || '',
          t.province || '',
          t.description || '',
        ]),
      }],
    });
  }

  return (
    <div className="page-shell">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <PageHeader title="Trainings" description="Schedule and manage empowerment training sessions.">
        <ViewToggle value={view} onChange={setView} />
        <Button variant="secondary" onClick={exportPdf} disabled={list.length === 0}>Export PDF</Button>
        {writable && <Button onClick={handleCreate}>Add training</Button>}
      </PageHeader>

      <div className="page-body">
        {list.length === 0 ? (
          <EmptyState
            title="No trainings yet"
            description="Create a training session and assign a trainer."
            action={writable ? <Button onClick={handleCreate}>Add training</Button> : null}
          />
        ) : view === 'table' ? (
          <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="p-3 border">Title</th>
                    <th className="p-3 border">Trainer</th>
                    <th className="p-3 border">Date</th>
                    <th className="p-3 border">Location</th>
                    <th className="p-3 border">Description</th>
                    {writable && <th className="p-3 border">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id} className="odd:bg-white even:bg-slate-50">
                      <td className="p-3 border align-middle">{t.title}</td>
                      <td className="p-3 border align-middle">{t.trainer_name}</td>
                      <td className="p-3 border align-middle">{t.date}</td>
                      <td className="p-3 border align-middle">{t.location}</td>
                      <td className="p-3 border align-middle">{t.description}</td>
                      {writable && (
                        <td className="p-3 border align-middle">
                          <RowActions
                            writable={writable}
                            onEdit={() => handleEdit(t)}
                            onDelete={async () => { await deleteTraining(t.id); await refresh(); }}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-4 content-start">
            {list.map((t) => (
              <TrainingCard
                key={t.id}
                t={t}
                writable={writable}
                onEdit={() => handleEdit(t)}
                onDelete={async () => { await deleteTraining(t.id); await refresh(); }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal title={editingId ? 'Edit training' : 'Create training'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClassName()} />
          <select required value={form.trainer_id} onChange={(e) => handleTrainerChange(e.target.value)} className={inputClassName()}>
            <option value="">Select trainer</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>{trainer.full_name} - {trainer.specialization}</option>
            ))}
          </select>
          <input type="datetime-local" placeholder="Start date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputClassName()} />
          <input type="datetime-local" placeholder="End date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputClassName()} />
          <input placeholder="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className={inputClassName()} />
          <input placeholder="Cell" value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} className={inputClassName()} />
          <input placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClassName()} />
          <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={inputClassName()} />
          <input placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className={inputClassName()} />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClassName()} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`sm:col-span-2 ${inputClassName()}`} />
          <FormActions
            onCancel={() => { setForm(empty); setEditingId(null); setOpen(false); }}
            submitLabel={editingId ? 'Update' : 'Create'}
          />
        </form>
      </Modal>
    </div>
  );
}
