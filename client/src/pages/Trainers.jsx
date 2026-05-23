import { useEffect, useState } from 'react';
import { createTrainer, deleteTrainer, getTrainers, updateTrainer } from '../lib/api';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ViewToggle from '../components/ViewToggle';

const empty = { full_name: '', phone_number: '', email: '', specialization: '', village: '', cell: '', sector: '', district: '', province: '' };

export default function Trainers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [view, setView] = useState('auto');

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
    <div className="w-full p-6">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold">Trainers</h2>
        <div className="flex items-center gap-3">
          <ViewToggle value={view} onChange={setView} />
          <button className="rounded bg-teal-600 px-4 py-2 text-white" onClick={handleCreate}>Create trainer</button>
        </div>
      </div>

      <div className="h-[70vh]">
        {list.length === 0 ? (
          <div className="text-sm text-slate-500">No trainers yet.</div>
        ) : (
          <>
            {view === 'table' ? (
              <div className="overflow-x-auto">
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
                      <th className="p-3 border">Actions</th>
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
                        <td className="p-3 border align-middle">
                          <div className="flex gap-2">
                            <button className="rounded border px-3 py-1" onClick={() => handleEdit(trainer)}>Edit</button>
                            <button className="rounded bg-rose-100 px-3 py-1 text-rose-700" onClick={async () => { await deleteTrainer(trainer.id); await refresh(); }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <div className="hidden md:block">
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
                        <th className="p-3 border">Actions</th>
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
                          <td className="p-3 border align-middle">
                            <div className="flex gap-2">
                              <button className="rounded border px-3 py-1" onClick={() => handleEdit(trainer)}>Edit</button>
                              <button className="rounded bg-rose-100 px-3 py-1 text-rose-700" onClick={async () => { await deleteTrainer(trainer.id); await refresh(); }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3 overflow-auto p-2">
                  {list.map((trainer) => (
                    <div key={trainer.id} className="bg-white rounded-lg shadow-sm p-4 border">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-slate-500">Name</div>
                          <div className="font-semibold">{trainer.full_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-500">Specialization</div>
                          <div className="font-medium">{trainer.specialization}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div>
                          <div className="text-xs text-slate-500">Phone</div>
                          <div>{trainer.phone_number}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Email</div>
                          <div>{trainer.email}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Village</div>
                          <div>{trainer.village || ''}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Province</div>
                          <div>{trainer.province || ''}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="rounded border px-3 py-1" onClick={() => handleEdit(trainer)}>Edit</button>
                        <button className="rounded bg-rose-100 px-3 py-1 text-rose-700" onClick={async () => { await deleteTrainer(trainer.id); await refresh(); }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Modal title={editingId ? 'Edit trainer' : 'Create trainer'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded border p-2" />
          <input required placeholder="Phone number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="rounded border p-2" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded border p-2" />
          <select required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="rounded border p-2">
            <option value="">Select specialization</option>
            <option>Entrepreneurship</option>
            <option>Financial Literacy</option>
            <option>Leadership</option>
            <option>Digital Skills</option>
            <option>Gender & GBV Prevention</option>
          </select>
          <input placeholder="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className="rounded border p-2" />
          <input placeholder="Cell" value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} className="rounded border p-2" />
          <input placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="rounded border p-2" />
          <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="rounded border p-2" />
          <input placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="rounded border p-2" />
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button className="rounded border px-4 py-2" type="button" onClick={() => { setForm(empty); setEditingId(null); setOpen(false); }}>Cancel</button>
            <button className="rounded bg-teal-600 px-4 py-2 text-white" type="submit">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}