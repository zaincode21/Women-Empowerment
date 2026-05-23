import { useEffect, useState } from 'react';
import { createAttendance, getAttendance, getParticipants, getTrainings } from '../lib/api';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ViewToggle from '../components/ViewToggle';

const empty = { participant_id: '', training_id: '', status: 'Present' };

export default function Attendance() {
  const [list, setList] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [view, setView] = useState('auto');

  async function refresh() {
    setList(await getAttendance());
    setParticipants(await getParticipants());
    setTrainings(await getTrainings());
  }

  useEffect(() => { refresh(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await createAttendance({ participant_id: Number(form.participant_id), training_id: Number(form.training_id), status: form.status });
      setAlert({ type: 'success', message: 'Attendance recorded' });
      setForm(empty);
      setOpen(false);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to record attendance' });
    }
  }

  function handleCreate() {
    setForm(empty);
    setOpen(true);
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
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold">Attendance</h2>
        <div className="flex items-center gap-3">
          <ViewToggle value={view} onChange={setView} />
          <button className="rounded bg-teal-600 px-4 py-2 text-white" onClick={handleCreate}>Record attendance</button>
        </div>
      </div>

      <div className="h-[70vh]">
        {list.length === 0 ? (
          <div className="text-sm text-slate-500">No attendance records yet.</div>
        ) : (
          <>
              {view === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="p-3 border">Participant</th>
                        <th className="p-3 border">Training</th>
                        <th className="p-3 border">Status</th>
                        <th className="p-3 border">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                          <td className="p-3 border align-middle">{r.participant_name}</td>
                          <td className="p-3 border align-middle">{r.training_title}</td>
                          <td className="p-3 border align-middle">{r.status}</td>
                          <td className="p-3 border align-middle">{formatDateTime(r.created_at)}</td>
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
                          <th className="p-3 border">Participant</th>
                          <th className="p-3 border">Training</th>
                          <th className="p-3 border">Status</th>
                          <th className="p-3 border">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((r) => (
                          <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                            <td className="p-3 border align-middle">{r.participant_name}</td>
                            <td className="p-3 border align-middle">{r.training_title}</td>
                            <td className="p-3 border align-middle">{r.status}</td>
                            <td className="p-3 border align-middle">{formatDateTime(r.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3 overflow-auto p-2">
                    {list.map((r) => (
                      <div key={r.id} className="bg-white rounded-lg shadow-sm p-4 border">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-slate-500">Participant</div>
                            <div className="font-semibold">{r.participant_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-500">Status</div>
                            <div className="font-medium">{r.status}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          <div className="text-xs text-slate-500">Training</div>
                          <div>{r.training_title}</div>
                          <div className="mt-2 text-xs text-slate-500">Date</div>
                          <div>{formatDateTime(r.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </>
        )}
      </div>

      <Modal title="Record attendance" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <select required value={form.participant_id} onChange={(e) => setForm({ ...form, participant_id: e.target.value })} className="rounded border p-2">
            <option value="">Select participant</option>
            {participants.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <select required value={form.training_id} onChange={(e) => setForm({ ...form, training_id: e.target.value })} className="rounded border p-2">
            <option value="">Select training</option>
            {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded border p-2">
            <option>Present</option>
            <option>Absent</option>
            <option>Late</option>
          </select>
          <div className="sm:col-span-3 flex justify-end gap-2 mt-2">
            <button className="rounded border px-4 py-2" type="button" onClick={() => { setForm(empty); setOpen(false); }}>Cancel</button>
            <button className="rounded bg-teal-600 px-4 py-2 text-white" type="submit">Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
