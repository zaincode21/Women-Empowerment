import { useEffect, useState } from 'react';
import { createTraining, deleteTraining, getTrainings, getTrainers, updateTraining } from '../lib/api';
import Modal from '../components/Modal';

const empty = { title: '', trainer_id: '', trainer_name: '', start_date: '', end_date: '', village: '', cell: '', sector: '', district: '', province: '', location: '', description: '' };

export default function Trainings() {
  const [list, setList] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);

  async function refresh() {
    setList(await getTrainings());
    setTrainers(await getTrainers());
  }
  useEffect(() => { refresh(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (editingId) await updateTraining(editingId, form);
    else await createTraining(form);
    setForm(empty);
    setEditingId(null);
    setOpen(false);
    await refresh();
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

  function formatDateTime(value) {
    if (!value) return '';
    try {
      const d = new Date(value);
      return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return String(value);
    }
  }

  return (
    <div className="w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Trainings</h2>
        <button className="rounded bg-teal-600 px-4 py-2 text-white" onClick={handleCreate}>Create training</button>
      </div>

      <div className="overflow-x-auto h-[70vh]">
        {list.length === 0 ? <div className="text-sm text-slate-500">No trainings yet.</div> : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-3 border">Title</th>
                <th className="p-3 border">Trainer</th>
                <th className="p-3 border">Start</th>
                <th className="p-3 border">End</th>
                <th className="p-3 border">Village</th>
                <th className="p-3 border">Cell</th>
                <th className="p-3 border">Sector</th>
                <th className="p-3 border">District</th>
                <th className="p-3 border">Province</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="odd:bg-white even:bg-slate-50">
                  <td className="p-3 border align-middle">{t.title}</td>
                  <td className="p-3 border align-middle">{t.trainer_name}</td>
                  <td className="p-3 border align-middle">{formatDateTime(t.start_date)}</td>
                  <td className="p-3 border align-middle">{formatDateTime(t.end_date)}</td>
                  <td className="p-3 border align-middle">{t.village || ''}</td>
                  <td className="p-3 border align-middle">{t.cell || ''}</td>
                  <td className="p-3 border align-middle">{t.sector || ''}</td>
                  <td className="p-3 border align-middle">{t.district || ''}</td>
                  <td className="p-3 border align-middle">{t.province || ''}</td>
                  <td className="p-3 border align-middle">
                    <div className="flex gap-2">
                      <button className="rounded border px-3 py-1" onClick={() => handleEdit(t)}>Edit</button>
                      <button className="rounded bg-rose-100 px-3 py-1 text-rose-700" onClick={async () => { await deleteTraining(t.id); await refresh(); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal title={editingId ? 'Edit training' : 'Create training'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded border p-2" />
          <select required value={form.trainer_id} onChange={(e) => handleTrainerChange(e.target.value)} className="rounded border p-2">
            <option value="">Select trainer</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>{trainer.full_name} - {trainer.specialization}</option>
            ))}
          </select>
          <input type="datetime-local" placeholder="Start date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="rounded border p-2" />
          <input type="datetime-local" placeholder="End date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="rounded border p-2" />
          <input placeholder="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className="rounded border p-2" />
          <input placeholder="Cell" value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} className="rounded border p-2" />
          <input placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="rounded border p-2" />
          <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="rounded border p-2" />
          <input placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="rounded border p-2" />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded border p-2" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2 rounded border p-2" />
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button className="rounded border px-4 py-2" type="button" onClick={() => { setForm(empty); setEditingId(null); setOpen(false); }}>Cancel</button>
            <button className="rounded bg-teal-600 px-4 py-2 text-white" type="submit">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
