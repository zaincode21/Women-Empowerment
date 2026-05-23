import { useEffect, useState } from 'react';
import { createEvaluation, getEvaluations, getParticipants } from '../lib/api';
import Modal from '../components/Modal';
import ViewToggle from '../components/ViewToggle';

const empty = { participant_id: '', progress: '', remarks: '' };

export default function Evaluations() {
  const [list, setList] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('auto');

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
    setList(await getEvaluations());
    setParticipants(await getParticipants());
  }

  useEffect(() => { refresh(); }, []);

  async function submit(e) {
    e.preventDefault();
    await createEvaluation({ participant_id: Number(form.participant_id), progress: form.progress, remarks: form.remarks });
    setForm(empty);
    setOpen(false);
    await refresh();
  }

  function handleCreate() {
    setForm(empty);
    setOpen(true);
  }

  return (
    <div className="w-full p-6">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold">Evaluations</h2>
        <div className="flex items-center gap-3">
          <ViewToggle value={view} onChange={setView} />
          <button className="rounded bg-teal-600 px-4 py-2 text-white" onClick={handleCreate}>Create evaluation</button>
        </div>
      </div>

      <div className="h-[70vh]">
        {list.length === 0 ? <div className="text-sm text-slate-500">No evaluations yet.</div> : (
          <>
            {view === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="p-3 border">Participant</th>
                      <th className="p-3 border">Progress</th>
                      <th className="p-3 border">Remarks</th>
                      <th className="p-3 border">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((e) => (
                      <tr key={e.id} className="odd:bg-white even:bg-slate-50">
                        <td className="p-3 border align-middle">{e.participant_name}</td>
                        <td className="p-3 border align-middle">{e.progress}</td>
                        <td className="p-3 border align-middle">{e.remarks}</td>
                        <td className="p-3 border align-middle">{formatDateTime(e.created_at)}</td>
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
                        <th className="p-3 border">Progress</th>
                        <th className="p-3 border">Remarks</th>
                        <th className="p-3 border">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((e) => (
                        <tr key={e.id} className="odd:bg-white even:bg-slate-50">
                          <td className="p-3 border align-middle">{e.participant_name}</td>
                          <td className="p-3 border align-middle">{e.progress}</td>
                          <td className="p-3 border align-middle">{e.remarks}</td>
                          <td className="p-3 border align-middle">{formatDateTime(e.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3 overflow-auto p-2">
                  {list.map((e) => (
                    <div key={e.id} className="bg-white rounded-lg shadow-sm p-4 border">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-slate-500">Participant</div>
                          <div className="font-semibold">{e.participant_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-500">Progress</div>
                          <div className="font-medium">{e.progress}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        <div className="text-xs text-slate-500">Remarks</div>
                        <div>{e.remarks}</div>
                        <div className="mt-2 text-xs text-slate-500">Date</div>
                        <div>{formatDateTime(e.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Modal title="Create evaluation" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <select required value={form.participant_id} onChange={(e) => setForm({ ...form, participant_id: e.target.value })} className="rounded border p-2">
            <option value="">Select participant</option>
            {participants.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <input required placeholder="Progress" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} className="rounded border p-2" />
          <textarea placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="sm:col-span-2 rounded border p-2" />
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button className="rounded border px-4 py-2" type="button" onClick={() => { setForm(empty); setOpen(false); }}>Cancel</button>
            <button className="rounded bg-teal-600 px-4 py-2 text-white" type="submit">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
