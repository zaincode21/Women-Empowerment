import { useEffect, useState } from 'react';
import { createParticipant, deleteParticipant, getParticipants, updateParticipant } from '../lib/api';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ViewToggle from '../components/ViewToggle';

const empty = { full_name: '', date_of_birth: '', village: '', cell: '', sector: '', district: '', province: '', address: '', phone_number: '', education_level: '', occupation: '' };

export default function Participants() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [view, setView] = useState('auto');

  async function refresh() {
    setList(await getParticipants());
  }

  useEffect(() => { refresh(); }, []);

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
    <div className="w-full p-6">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold">Participants</h2>
        <div className="flex items-center gap-3">
          <ViewToggle value={view} onChange={setView} />
          <button className="rounded bg-teal-600 px-4 py-2 text-white" onClick={handleCreate}>Create participant</button>
        </div>
      </div>

      <div className="h-[70vh]">
        {list.length === 0 ? (
          <div className="text-sm text-slate-500">No participants yet.</div>
        ) : (
          <>
            {/* Desktop table or forced table */}
            {(view === 'table') ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="p-3 border">Name</th>
                      <th className="p-3 border">Date of birth</th>
                      <th className="p-3 border">Education</th>
                      <th className="p-3 border">Occupation</th>
                      <th className="p-3 border">Phone</th>
                      <th className="p-3 border">Village</th>
                      <th className="p-3 border">Cell</th>
                      <th className="p-3 border">Sector</th>
                      <th className="p-3 border">District</th>
                      <th className="p-3 border">Province</th>
                      <th className="p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => (
                      <tr key={p.id} className="odd:bg-white even:bg-slate-50">
                        <td className="p-3 border align-middle">{p.full_name}</td>
                        <td className="p-3 border align-middle">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : ''}</td>
                        <td className="p-3 border align-middle">{p.education_level}</td>
                        <td className="p-3 border align-middle">{p.occupation}</td>
                        <td className="p-3 border align-middle">{p.phone_number}</td>
                        <td className="p-3 border align-middle">{p.village || ''}</td>
                        <td className="p-3 border align-middle">{p.cell || ''}</td>
                        <td className="p-3 border align-middle">{p.sector || ''}</td>
                        <td className="p-3 border align-middle">{p.district || ''}</td>
                        <td className="p-3 border align-middle">{p.province || ''}</td>
                        <td className="p-3 border align-middle">
                          <div className="flex gap-2">
                            <button className="rounded border px-3 py-1" onClick={() => handleEdit(p)}>Edit</button>
                            <button className="rounded bg-rose-100 px-3 py-1 text-rose-700" onClick={async () => { await deleteParticipant(p.id); await refresh(); }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`${view === 'cards' ? '' : 'md:block'} md:block hidden overflow-x-auto`}>
                {/* when auto, show desktop table on md+ */}
                <div className="hidden md:block">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="p-3 border">Name</th>
                        <th className="p-3 border">Date of birth</th>
                        <th className="p-3 border">Education</th>
                        <th className="p-3 border">Occupation</th>
                        <th className="p-3 border">Phone</th>
                        <th className="p-3 border">Village</th>
                        <th className="p-3 border">Cell</th>
                        <th className="p-3 border">Sector</th>
                        <th className="p-3 border">District</th>
                        <th className="p-3 border">Province</th>
                        <th className="p-3 border">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((p) => (
                        <tr key={p.id} className="odd:bg-white even:bg-slate-50">
                          <td className="p-3 border align-middle">{p.full_name}</td>
                          <td className="p-3 border align-middle">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : ''}</td>
                          <td className="p-3 border align-middle">{p.education_level}</td>
                          <td className="p-3 border align-middle">{p.occupation}</td>
                          <td className="p-3 border align-middle">{p.phone_number}</td>
                          <td className="p-3 border align-middle">{p.village || ''}</td>
                          <td className="p-3 border align-middle">{p.cell || ''}</td>
                          <td className="p-3 border align-middle">{p.sector || ''}</td>
                          <td className="p-3 border align-middle">{p.district || ''}</td>
                          <td className="p-3 border align-middle">{p.province || ''}</td>
                          <td className="p-3 border align-middle">
                            <div className="flex gap-2">
                              <button className="rounded border px-3 py-1" onClick={() => handleEdit(p)}>Edit</button>
                              <button className="rounded bg-rose-100 px-3 py-1 text-rose-700" onClick={async () => { await deleteParticipant(p.id); await refresh(); }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                {(view === 'cards' || view === 'auto') && (
                  <div className={`md:hidden space-y-3 overflow-auto p-2 ${view === 'cards' ? '' : ''}`}>
                    {list.map((p) => (
                      <div key={p.id} className="bg-white rounded-lg shadow-sm p-4 border">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-slate-500">Name</div>
                            <div className="font-semibold">{p.full_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-500">Phone</div>
                            <div className="font-medium">{p.phone_number}</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                          <div>
                            <div className="text-xs text-slate-500">DOB</div>
                            <div>{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : ''}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Education</div>
                            <div>{p.education_level}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Village</div>
                            <div>{p.village || ''}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Province</div>
                            <div>{p.province || ''}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button className="rounded border px-3 py-1" onClick={() => handleEdit(p)}>Edit</button>
                          <button className="rounded bg-rose-100 px-3 py-1 text-rose-700" onClick={async () => { await deleteParticipant(p.id); await refresh(); }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Modal title={editingId ? 'Edit participant' : 'Create participant'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded border p-2" />
          <input required type="date" placeholder="Date of birth" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="rounded border p-2" />
          <input placeholder="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className="rounded border p-2" />
          <input placeholder="Cell" value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} className="rounded border p-2" />
          <input placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="rounded border p-2" />
          <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="rounded border p-2" />
          <input placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="rounded border p-2" />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded border p-2" />
          <input placeholder="Phone" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="rounded border p-2" />
          <select required value={form.education_level} onChange={(e) => setForm({ ...form, education_level: e.target.value })} className="rounded border p-2">
            <option value="">Select education level</option>
            <option>No formal education</option>
            <option>Primary</option>
            <option>Ordinary Level</option>
            <option>Advanced Level</option>
            <option>TVET / Vocational</option>
            <option>University</option>
          </select>
          <input placeholder="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="rounded border p-2" />
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button className="rounded border px-4 py-2" type="button" onClick={() => { setForm(empty); setEditingId(null); setOpen(false); }}>Cancel</button>
            <button className="rounded bg-teal-600 px-4 py-2 text-white" type="submit">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
