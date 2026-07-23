import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createParticipant, deleteParticipant, getParticipants, updateParticipant } from '../lib/api';
import { canWrite, canAccess } from '../lib/auth';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ViewToggle from '../components/ViewToggle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { RowActions } from '../components/ui/RowActions';
import { inputClassName } from '../components/ui/Field';

const empty = { full_name: '', age: '', date_of_birth: '', village: '', cell: '', sector: '', district: '', province: '', address: '', phone_number: '', education_level: '', occupation: '' };

function ParticipantCard({ p, writable, canViewProfile, onView, onEdit, onDelete }) {
  const initial = p.full_name?.charAt(0)?.toUpperCase() || '?';
  return (
    <article className="surface-card flex h-full flex-col p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{p.full_name}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">{p.occupation || 'No occupation'}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Age</dt>
          <dd className="font-medium text-slate-800">{p.age ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Phone</dt>
          <dd className="truncate font-medium text-slate-800">{p.phone_number || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Education</dt>
          <dd className="truncate font-medium text-slate-800">{p.education_level || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Village</dt>
          <dd className="truncate text-slate-700">{p.village || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Province</dt>
          <dd className="truncate text-slate-700">{p.province || '—'}</dd>
        </div>
      </dl>

      {(writable || canViewProfile) && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <RowActions
            writable={writable}
            onView={canViewProfile ? onView : undefined}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </article>
  );
}

export default function Participants() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [view, setView] = useState('cards');
  const [search, setSearch] = useState('');
  const writable = canWrite('participants');
  const canViewProfile = canAccess('monitoring', 'read');
  const navigate = useNavigate();

  async function refresh(q = search) {
    setList(await getParticipants(q.trim() || undefined));
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => refresh(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form };
    try {
      if (editingId) {
        await updateParticipant(editingId, payload);
        setAlert({ type: 'success', message: 'Participant updated' });
      } else {
        await createParticipant(payload);
        setAlert({ type: 'success', message: 'Participant created' });
      }
      setForm(empty);
      setEditingId(null);
      setOpen(false);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save participant' });
    }
  }

  function handleCreate() {
    setForm(empty);
    setEditingId(null);
    setOpen(true);
  }

  function handleEdit(p) {
    setForm({ ...p });
    setEditingId(p.id);
    setOpen(true);
  }

  return (
    <div className="page-shell">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <PageHeader
        title="Participants"
        description="Register and manage women enrolled in empowerment programs."
      >
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClassName()} min-w-[200px]`}
        />
        <ViewToggle value={view} onChange={setView} />
        {writable && <Button onClick={handleCreate}>Add participant</Button>}
      </PageHeader>

      <div className="page-body">
        {list.length === 0 ? (
          <EmptyState
            title="No participants yet"
            description="Start by registering your first program participant."
            action={writable ? <Button onClick={handleCreate}>Add participant</Button> : null}
          />
        ) : view === 'table' ? (
          <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="p-3 border">Name</th>
                    <th className="p-3 border">Age</th>
                    <th className="p-3 border">Education</th>
                    <th className="p-3 border">Occupation</th>
                    <th className="p-3 border">Phone</th>
                    <th className="p-3 border">Village</th>
                    <th className="p-3 border">Cell</th>
                    <th className="p-3 border">Sector</th>
                    <th className="p-3 border">District</th>
                    <th className="p-3 border">Province</th>
                    {(writable || canViewProfile) && <th className="p-3 border">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id} className="odd:bg-white even:bg-slate-50">
                      <td className="p-3 border align-middle">{p.full_name}</td>
                      <td className="p-3 border align-middle">{p.age ?? ''}</td>
                      <td className="p-3 border align-middle">{p.education_level}</td>
                      <td className="p-3 border align-middle">{p.occupation}</td>
                      <td className="p-3 border align-middle">{p.phone_number}</td>
                      <td className="p-3 border align-middle">{p.village || ''}</td>
                      <td className="p-3 border align-middle">{p.cell || ''}</td>
                      <td className="p-3 border align-middle">{p.sector || ''}</td>
                      <td className="p-3 border align-middle">{p.district || ''}</td>
                      <td className="p-3 border align-middle">{p.province || ''}</td>
                      {(writable || canViewProfile) && (
                        <td className="p-3 border align-middle">
                          <RowActions
                            writable={writable}
                            onView={canViewProfile ? () => navigate(`/monitoring/${p.id}`) : undefined}
                            onEdit={() => handleEdit(p)}
                            onDelete={async () => { await deleteParticipant(p.id); await refresh(); }}
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
            {list.map((p) => (
              <ParticipantCard
                key={p.id}
                p={p}
                writable={writable}
                canViewProfile={canViewProfile}
                onView={() => navigate(`/monitoring/${p.id}`)}
                onEdit={() => handleEdit(p)}
                onDelete={async () => { await deleteParticipant(p.id); await refresh(); }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal title={editingId ? 'Edit participant' : 'Create participant'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClassName()} />
          <input required type="number" min="0" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={inputClassName()} />
          <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className={inputClassName()} />
          <input placeholder="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className={inputClassName()} />
          <input placeholder="Cell" value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} className={inputClassName()} />
          <input placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClassName()} />
          <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={inputClassName()} />
          <input placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className={inputClassName()} />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClassName()} />
          <input placeholder="Phone" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className={inputClassName()} />
          <select required value={form.education_level} onChange={(e) => setForm({ ...form, education_level: e.target.value })} className={inputClassName()}>
            <option value="">Select education level</option>
            <option>No formal education</option>
            <option>Primary</option>
            <option>Ordinary Level</option>
            <option>Advanced Level</option>
            <option>TVET / Vocational</option>
            <option>University</option>
          </select>
          <input placeholder="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputClassName()} />
          <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => { setForm(empty); setEditingId(null); setOpen(false); }}>Cancel</Button>
            <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
