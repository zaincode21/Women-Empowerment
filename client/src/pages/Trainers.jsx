import { useEffect, useState } from 'react';
import { createTrainer, deleteTrainer, getTrainers, updateTrainer } from '../lib/api';
import { canWrite } from '../lib/auth';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ViewToggle from '../components/ViewToggle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { RowActions, FormActions } from '../components/ui/RowActions';
import { inputClassName } from '../components/ui/Field';

const empty = { full_name: '', phone_number: '', email: '', specialization: '', village: '', cell: '', sector: '', district: '', province: '' };

function TrainerCard({ trainer, writable, onEdit, onDelete }) {
  const initial = trainer.full_name?.charAt(0)?.toUpperCase() || '?';
  return (
    <article className="surface-card flex h-full flex-col p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{trainer.full_name}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">{trainer.specialization || 'No specialization'}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Email</dt>
          <dd className="truncate font-medium text-slate-800">{trainer.email || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Phone</dt>
          <dd className="truncate text-slate-700">{trainer.phone_number || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Village</dt>
          <dd className="truncate text-slate-700">{trainer.village || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">District</dt>
          <dd className="truncate text-slate-700">{trainer.district || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Province</dt>
          <dd className="truncate text-slate-700">{trainer.province || '—'}</dd>
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

export default function Trainers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [view, setView] = useState('cards');
  const writable = canWrite('trainers');

  async function refresh() {
    setList(await getTrainers());
  }

  useEffect(() => { refresh(); }, []);

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form };
    try {
      if (editingId) {
        await updateTrainer(editingId, payload);
        setAlert({ type: 'success', message: 'Trainer updated' });
      } else {
        await createTrainer(payload);
        setAlert({ type: 'success', message: 'Trainer created' });
      }
      setForm(empty);
      setEditingId(null);
      setOpen(false);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save trainer' });
    }
  }

  function handleCreate() {
    setForm(empty);
    setEditingId(null);
    setOpen(true);
  }

  function handleEdit(trainer) {
    setForm({ ...trainer });
    setEditingId(trainer.id);
    setOpen(true);
  }

  return (
    <div className="page-shell">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <PageHeader title="Trainers" description="Manage facilitators assigned to empowerment programs.">
        <ViewToggle value={view} onChange={setView} />
        {writable && <Button onClick={handleCreate}>Add trainer</Button>}
      </PageHeader>

      <div className="page-body">
        {list.length === 0 ? (
          <EmptyState
            title="No trainers yet"
            description="Add trainers before scheduling training sessions."
            action={writable ? <Button onClick={handleCreate}>Add trainer</Button> : null}
          />
        ) : view === 'table' ? (
          <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="p-3 border">Name</th>
                    <th className="p-3 border">Phone</th>
                    <th className="p-3 border">Email</th>
                    <th className="p-3 border">Specialization</th>
                    <th className="p-3 border">Village</th>
                    <th className="p-3 border">Cell</th>
                    <th className="p-3 border">Sector</th>
                    <th className="p-3 border">District</th>
                    <th className="p-3 border">Province</th>
                    {writable && <th className="p-3 border">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((trainer) => (
                    <tr key={trainer.id} className="odd:bg-white even:bg-slate-50">
                      <td className="p-3 border align-middle">{trainer.full_name}</td>
                      <td className="p-3 border align-middle">{trainer.phone_number}</td>
                      <td className="p-3 border align-middle">{trainer.email}</td>
                      <td className="p-3 border align-middle">{trainer.specialization}</td>
                      <td className="p-3 border align-middle">{trainer.village || ''}</td>
                      <td className="p-3 border align-middle">{trainer.cell || ''}</td>
                      <td className="p-3 border align-middle">{trainer.sector || ''}</td>
                      <td className="p-3 border align-middle">{trainer.district || ''}</td>
                      <td className="p-3 border align-middle">{trainer.province || ''}</td>
                      {writable && (
                        <td className="p-3 border align-middle">
                          <RowActions
                            writable={writable}
                            onEdit={() => handleEdit(trainer)}
                            onDelete={async () => { await deleteTrainer(trainer.id); await refresh(); }}
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
            {list.map((trainer) => (
              <TrainerCard
                key={trainer.id}
                trainer={trainer}
                writable={writable}
                onEdit={() => handleEdit(trainer)}
                onDelete={async () => { await deleteTrainer(trainer.id); await refresh(); }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal title={editingId ? 'Edit trainer' : 'Create trainer'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClassName()} />
          <input required placeholder="Phone number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className={inputClassName()} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClassName()} />
          <select required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputClassName()}>
            <option value="">Select specialization</option>
            <option>Entrepreneurship</option>
            <option>Financial Literacy</option>
            <option>Leadership</option>
            <option>Digital Skills</option>
            <option>Gender & GBV Prevention</option>
          </select>
          <input placeholder="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className={inputClassName()} />
          <input placeholder="Cell" value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} className={inputClassName()} />
          <input placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClassName()} />
          <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={inputClassName()} />
          <input placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className={inputClassName()} />
          <FormActions
            onCancel={() => { setForm(empty); setEditingId(null); setOpen(false); }}
            submitLabel={editingId ? 'Update' : 'Create'}
          />
        </form>
      </Modal>
    </div>
  );
}