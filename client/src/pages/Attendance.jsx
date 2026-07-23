import { useEffect, useMemo, useState } from 'react';
import {
  createAttendance,
  deleteAttendance,
  enrollTrainingParticipants,
  getAttendance,
  getParticipants,
  getTrainingParticipants,
  getTrainings,
  unenrollTrainingParticipant,
  updateAttendance,
} from '../lib/api';
import { canWrite } from '../lib/auth';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ViewToggle from '../components/ViewToggle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { RowActions, FormActions } from '../components/ui/RowActions';
import { inputClassName, selectClassName } from '../components/ui/Field';

const empty = { participant_id: '', training_id: '', status: 'Present' };
const ATTENDED_STATUSES = new Set(['Present', 'Late']);

function buildSummary(records) {
  const map = {};
  for (const r of records) {
    const key = `${r.participant_id}::${r.training_id}`;
    if (!map[key]) {
      map[key] = {
        participant_id: r.participant_id,
        participant_name: r.participant_name,
        training_id: r.training_id,
        training_title: r.training_title,
        total: 0,
        attended: 0,
      };
    }
    map[key].total += 1;
    if (ATTENDED_STATUSES.has(r.status)) map[key].attended += 1;
  }
  return Object.values(map).sort((a, b) =>
    a.participant_name.localeCompare(b.participant_name) ||
    a.training_title.localeCompare(b.training_title)
  );
}

function pctColor(pct) {
  if (pct >= 80) return { bar: '#16a34a', badge: 'bg-green-100 text-green-800' };
  if (pct >= 50) return { bar: '#d97706', badge: 'bg-amber-100 text-amber-800' };
  return { bar: '#dc2626', badge: 'bg-red-100 text-red-800' };
}

function ProgressBar({ pct }) {
  const { bar } = pctColor(pct);
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div style={{ width: `${pct}%`, background: bar, transition: 'width .4s' }} className="h-full rounded-full" />
      </div>
      <span className="text-xs font-semibold w-10 text-right" style={{ color: bar }}>{pct}%</span>
    </div>
  );
}

function EligibleBadge({ pct }) {
  const { badge } = pctColor(pct);
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>
      {pct >= 80 ? '✓ Eligible' : '✗ Below 80%'}
    </span>
  );
}

export default function Attendance() {
  const [list, setList] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState('');
  const [presentIds, setPresentIds] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterSelection, setRosterSelection] = useState([]);
  const [alert, setAlert] = useState(null);
  const [view, setView] = useState('auto');
  const [filterEligible, setFilterEligible] = useState('all');
  const [savingSession, setSavingSession] = useState(false);
  const writable = canWrite('attendance');

  async function refresh() {
    const [att, parts, trains] = await Promise.all([
      getAttendance(),
      getParticipants(),
      getTrainings(),
    ]);
    setList(att);
    setAllParticipants(parts);
    setTrainings(trains);
  }

  async function refreshRoster(trainingId = selectedTrainingId) {
    if (!trainingId) {
      setEnrolled([]);
      setPresentIds([]);
      return;
    }
    try {
      const roster = await getTrainingParticipants(trainingId);
      setEnrolled(roster);
      setPresentIds(roster.map((p) => String(p.id)));
    } catch {
      setEnrolled([]);
      setPresentIds([]);
    }
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    refreshRoster(selectedTrainingId);
  }, [selectedTrainingId]);

  function togglePresent(participantId) {
    const id = String(participantId);
    setPresentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAllPresent(checked) {
    if (checked) {
      setPresentIds(enrolled.map((p) => String(p.id)));
    } else {
      setPresentIds([]);
    }
  }

  async function saveSessionAttendance() {
    if (!selectedTrainingId || enrolled.length === 0) return;
    setSavingSession(true);
    try {
      const presentSet = new Set(presentIds);
      await Promise.all(
        enrolled.map((p) =>
          createAttendance({
            participant_id: Number(p.id),
            training_id: Number(selectedTrainingId),
            status: presentSet.has(String(p.id)) ? 'Present' : 'Absent',
          })
        )
      );
      setAlert({
        type: 'success',
        message: `Session saved: ${presentIds.length} present, ${enrolled.length - presentIds.length} absent`,
      });
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save session attendance' });
    } finally {
      setSavingSession(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAttendance(editingId, { status: form.status });
        setAlert({ type: 'success', message: 'Attendance updated' });
      } else {
        await createAttendance({
          participant_id: Number(form.participant_id),
          training_id: Number(form.training_id),
          status: form.status,
        });
        setAlert({ type: 'success', message: 'Attendance recorded' });
      }
      setForm(empty);
      setEditingId(null);
      setOpen(false);
      await refresh();
      await refreshRoster(form.training_id || selectedTrainingId);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save attendance' });
    }
  }

  function handleEdit(r) {
    setForm({
      participant_id: String(r.participant_id),
      training_id: String(r.training_id),
      status: r.status,
    });
    setEditingId(r.id);
    setOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await deleteAttendance(id);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete' });
    }
  }

  function openRoster() {
    if (!selectedTrainingId) {
      setAlert({ type: 'error', message: 'Select a training first' });
      return;
    }
    setRosterSelection([]);
    setRosterOpen(true);
  }

  async function saveRoster(e) {
    e.preventDefault();
    if (rosterSelection.length === 0) {
      setAlert({ type: 'error', message: 'Select at least one participant to enroll' });
      return;
    }
    try {
      const updated = await enrollTrainingParticipants(
        selectedTrainingId,
        rosterSelection.map(Number)
      );
      setEnrolled(updated);
      setPresentIds((prev) => {
        const next = new Set(prev);
        rosterSelection.forEach((id) => next.add(String(id)));
        return [...next];
      });
      setRosterOpen(false);
      setRosterSelection([]);
      setAlert({ type: 'success', message: 'Participants enrolled' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to enroll participants' });
    }
  }

  async function removeFromRoster(participantId) {
    if (!window.confirm('Remove this participant from the training roster?')) return;
    try {
      await unenrollTrainingParticipant(selectedTrainingId, participantId);
      await refreshRoster();
      setAlert({ type: 'success', message: 'Participant removed from roster' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to remove participant' });
    }
  }

  function formatDateTime(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return String(value);
    }
  }

  const filteredList = useMemo(() => {
    if (!selectedTrainingId) return list;
    return list.filter((r) => String(r.training_id) === selectedTrainingId);
  }, [list, selectedTrainingId]);

  const summary = buildSummary(filteredList);

  const filteredSummary = summary.filter((row) => {
    const pct = row.total === 0 ? 0 : Math.round((row.attended / row.total) * 100);
    if (filterEligible === 'eligible' && pct < 80) return false;
    if (filterEligible === 'ineligible' && pct >= 80) return false;
    return true;
  });

  const eligibleCount = summary.filter((r) =>
    r.total > 0 && Math.round((r.attended / r.total) * 100) >= 80
  ).length;

  const selectedTraining = trainings.find((t) => String(t.id) === selectedTrainingId);
  const enrolledIds = new Set(enrolled.map((p) => p.id));
  const availableToEnroll = allParticipants.filter((p) => !enrolledIds.has(p.id));
  const allChecked = enrolled.length > 0 && presentIds.length === enrolled.length;
  const someChecked = presentIds.length > 0 && presentIds.length < enrolled.length;

  const modalParticipants = editingId
    ? allParticipants
    : enrolled;

  return (
    <div className="page-shell">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <PageHeader title="Attendance" description="Select a training, tick present participants, then save the session.">
        <ViewToggle value={view} onChange={setView} />
        {writable && (
          <>
            <Button variant="secondary" onClick={openRoster} disabled={!selectedTrainingId}>
              Manage roster
            </Button>
            <Button
              onClick={saveSessionAttendance}
              disabled={!selectedTrainingId || enrolled.length === 0 || savingSession}
            >
              {savingSession ? 'Saving…' : 'Save session'}
            </Button>
          </>
        )}
      </PageHeader>

      <div className="page-body">
        <div className="surface-card p-4">
          <label className="grid gap-1.5 text-sm max-w-xl">
            <span className="font-medium text-slate-700">1. Select training</span>
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              className={selectClassName()}
            >
              <option value="">Choose a training…</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
          {selectedTraining && (
            <p className="mt-2 text-sm text-slate-500">
              {selectedTraining.trainer_name ? `Trainer: ${selectedTraining.trainer_name}` : 'No trainer assigned'}
              {selectedTraining.location ? ` · ${selectedTraining.location}` : ''}
              {' · '}
              {enrolled.length} enrolled · {presentIds.length} marked present
            </p>
          )}
        </div>

        {!selectedTrainingId ? (
          <EmptyState
            title="Select a training to continue"
            description="Choose a training above. Enrolled participants will appear with checkboxes so you can mark who is present."
          />
        ) : (
          <>
            <div className="surface-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <div>
                  <h3 className="font-semibold text-slate-800">2. Mark attendance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Check present participants. Unchecked will be saved as Absent.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {writable && (
                    <Button size="sm" variant="secondary" onClick={openRoster}>
                      Add participants
                    </Button>
                  )}
                  {writable && enrolled.length > 0 && (
                    <Button size="sm" onClick={saveSessionAttendance} disabled={savingSession}>
                      {savingSession ? 'Saving…' : 'Save session'}
                    </Button>
                  )}
                </div>
              </div>
              {enrolled.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No participants enrolled yet.
                  {writable && ' Use “Manage roster” to add participants to this training.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 border-b w-14">
                          {writable ? (
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={(el) => {
                                if (el) el.indeterminate = someChecked;
                              }}
                              onChange={(e) => toggleAllPresent(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                              aria-label="Select all present"
                            />
                          ) : (
                            'Present'
                          )}
                        </th>
                        <th className="px-4 py-3 border-b">Participant</th>
                        <th className="px-4 py-3 border-b">Phone</th>
                        <th className="px-4 py-3 border-b">Village</th>
                        <th className="px-4 py-3 border-b">Status</th>
                        {writable && <th className="px-4 py-3 border-b">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {enrolled.map((p) => {
                        const checked = presentIds.includes(String(p.id));
                        return (
                          <tr
                            key={p.id}
                            className={`odd:bg-white even:bg-slate-50 ${checked ? 'bg-emerald-50/40' : ''}`}
                          >
                            <td className="px-4 py-3 border-b">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!writable}
                                onChange={() => togglePresent(p.id)}
                                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                aria-label={`Mark ${p.full_name} present`}
                              />
                            </td>
                            <td className="px-4 py-3 border-b font-medium text-slate-800">{p.full_name}</td>
                            <td className="px-4 py-3 border-b text-slate-600">{p.phone_number || '—'}</td>
                            <td className="px-4 py-3 border-b text-slate-600">{p.village || '—'}</td>
                            <td className="px-4 py-3 border-b">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                checked ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {checked ? 'Present' : 'Absent'}
                              </span>
                            </td>
                            {writable && (
                              <td className="px-4 py-3 border-b">
                                <Button size="sm" variant="danger" type="button" onClick={() => removeFromRoster(p.id)}>
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Records" value={filteredList.length} />
              <StatCard label="Enrolled" value={enrolled.length} />
              <StatCard label="Eligible (≥ 80%)" value={eligibleCount} valueClass="text-green-700" />
              <StatCard label="Below 80%" value={summary.length - eligibleCount} valueClass="text-red-600" />
            </div>

            <div className="surface-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <h3 className="font-semibold text-slate-800">Attendance rate</h3>
                <select
                  value={filterEligible}
                  onChange={(e) => setFilterEligible(e.target.value)}
                  className={selectClassName('!w-auto !py-1.5')}
                >
                  <option value="all">All</option>
                  <option value="eligible">Eligible only (≥ 80%)</option>
                  <option value="ineligible">Below 80% only</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 border-b">Participant</th>
                      <th className="px-4 py-3 border-b text-center">Sessions</th>
                      <th className="px-4 py-3 border-b text-center">Attended</th>
                      <th className="px-4 py-3 border-b min-w-[180px]">Attendance %</th>
                      <th className="px-4 py-3 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummary.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">
                          No attendance recorded for this training yet.
                        </td>
                      </tr>
                    ) : (
                      filteredSummary.map((row) => {
                        const pct = row.total === 0 ? 0 : Math.round((row.attended / row.total) * 100);
                        return (
                          <tr key={`${row.participant_id}-${row.training_id}`} className="odd:bg-white even:bg-slate-50">
                            <td className="px-4 py-3 border-b font-medium text-slate-800">{row.participant_name}</td>
                            <td className="px-4 py-3 border-b text-center text-slate-600">{row.total}</td>
                            <td className="px-4 py-3 border-b text-center text-slate-600">{row.attended}</td>
                            <td className="px-4 py-3 border-b"><ProgressBar pct={pct} /></td>
                            <td className="px-4 py-3 border-b"><EligibleBadge pct={pct} /></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="surface-card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <h3 className="font-semibold text-slate-800">Session records</h3>
              </div>
              {filteredList.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">No session records for this training.</div>
              ) : view === 'table' ? (
                <div className="overflow-x-auto">
                  <RawTable list={filteredList} formatDateTime={formatDateTime} writable={writable} onEdit={handleEdit} onDelete={handleDelete} hideTraining />
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <RawTable list={filteredList} formatDateTime={formatDateTime} writable={writable} onEdit={handleEdit} onDelete={handleDelete} hideTraining />
                  </div>
                  <div className="md:hidden space-y-3 p-3">
                    {filteredList.map((r) => (
                      <RawCard key={r.id} r={r} formatDateTime={formatDateTime} writable={writable} onEdit={handleEdit} onDelete={handleDelete} hideTraining />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <Modal title={editingId ? 'Edit attendance' : 'Record attendance'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid gap-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Training</span>
            <select
              required
              disabled
              value={form.training_id}
              className={inputClassName()}
            >
              <option value="">Select training</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Participant (enrolled only)</span>
            <select
              required
              disabled={Boolean(editingId)}
              value={form.participant_id}
              onChange={(e) => setForm({ ...form, participant_id: e.target.value })}
              className={inputClassName()}
            >
              <option value="">Select participant</option>
              {modalParticipants.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
            {!editingId && enrolled.length === 0 && (
              <span className="text-xs text-amber-700">Enroll participants on this training first.</span>
            )}
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClassName()}
            >
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
            </select>
          </label>

          <FormActions
            className=""
            onCancel={() => { setForm(empty); setOpen(false); }}
            submitLabel={editingId ? 'Update' : 'Record'}
          />
        </form>
      </Modal>

      <Modal title="Manage training roster" open={rosterOpen} onClose={() => setRosterOpen(false)}>
        <form onSubmit={saveRoster} className="grid gap-4">
          <p className="text-sm text-slate-600">
            Enroll participants into <strong>{selectedTraining?.title}</strong>. Only enrolled participants can be marked for attendance.
          </p>
          {availableToEnroll.length === 0 ? (
            <p className="text-sm text-slate-500">All registered participants are already enrolled.</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {availableToEnroll.map((p) => {
                const checked = rosterSelection.includes(String(p.id));
                return (
                  <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setRosterSelection((prev) =>
                          e.target.checked
                            ? [...prev, String(p.id)]
                            : prev.filter((id) => id !== String(p.id))
                        );
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-800">{p.full_name}</span>
                    <span className="text-xs text-slate-400">{p.phone_number || ''}</span>
                  </label>
                );
              })}
            </div>
          )}
          <FormActions
            className=""
            onCancel={() => setRosterOpen(false)}
            submitLabel="Enroll selected"
          />
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ label, value, valueClass = 'text-slate-800' }) {
  return (
    <div className="surface-card px-4 py-3">
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Present: 'bg-green-100 text-green-800',
    Absent: 'bg-red-100 text-red-800',
    Late: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function RawTable({ list, formatDateTime, writable, onEdit, onDelete, hideTraining }) {
  return (
    <table className="w-full table-auto border-collapse text-sm">
      <thead>
        <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="px-4 py-3 border-b">Participant</th>
          {!hideTraining && <th className="px-4 py-3 border-b">Training</th>}
          <th className="px-4 py-3 border-b">Status</th>
          <th className="px-4 py-3 border-b">Date</th>
          {writable && <th className="px-4 py-3 border-b">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {list.map((r) => (
          <tr key={r.id} className="odd:bg-white even:bg-slate-50">
            <td className="px-4 py-3 border-b font-medium text-slate-800">{r.participant_name}</td>
            {!hideTraining && <td className="px-4 py-3 border-b text-slate-600">{r.training_title}</td>}
            <td className="px-4 py-3 border-b"><StatusPill status={r.status} /></td>
            <td className="px-4 py-3 border-b text-slate-500">{formatDateTime(r.created_at)}</td>
            {writable && (
              <td className="px-4 py-3 border-b">
                <RowActions writable={writable} onEdit={() => onEdit(r)} onDelete={() => onDelete(r.id)} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RawCard({ r, formatDateTime, writable, onEdit, onDelete, hideTraining }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">Participant</div>
          <div className="font-semibold">{r.participant_name}</div>
        </div>
        <StatusPill status={r.status} />
      </div>
      <div className="mt-3 text-sm text-slate-600">
        {!hideTraining && (
          <>
            <div className="text-xs text-slate-500">Training</div>
            <div>{r.training_title}</div>
          </>
        )}
        <div className="mt-2 text-xs text-slate-500">Date</div>
        <div>{formatDateTime(r.created_at)}</div>
      </div>
      {writable && (
        <div className="mt-3">
          <RowActions writable={writable} onEdit={() => onEdit(r)} onDelete={() => onDelete(r.id)} />
        </div>
      )}
    </div>
  );
}
