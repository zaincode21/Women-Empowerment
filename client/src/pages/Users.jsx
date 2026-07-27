import { useEffect, useState } from 'react';
import { deleteUser, getUsers, registerUser, resetUserPassword, updateUser } from '../lib/api';
import { getUser, canAccess } from '../lib/auth';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import { Navigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { FormActions } from '../components/ui/RowActions';
import { inputClassName } from '../components/ui/Field';

const emptyCreate = { username: '', password: '', role: 'staff', full_name: '', email: '', phone_number: '' };
const emptyEdit = { username: '', role: 'staff', full_name: '', email: '', phone_number: '' };

function formatRole(role) {
  return role?.replace(/_/g, ' ') || '';
}

export default function Users() {
  const [list, setList] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [editingId, setEditingId] = useState(null);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const currentUser = getUser();
  const admin = canAccess('users', 'read');
  const writable = canAccess('users', 'write');

  async function refresh() {
    setList(await getUsers());
  }

  useEffect(() => {
    if (admin) refresh();
  }, [admin]);

  if (!admin) {
    return <Navigate to="/" replace />;
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await registerUser(createForm);
      setAlert({ type: 'success', message: 'User created' });
      setCreateForm(emptyCreate);
      setCreateOpen(false);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to create user' });
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      await updateUser(editingId, editForm);
      setAlert({ type: 'success', message: 'User updated' });
      setEditForm(emptyEdit);
      setEditingId(null);
      setEditOpen(false);
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update user' });
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    try {
      await resetUserPassword(resetUserId, resetPassword);
      setAlert({ type: 'success', message: 'Password reset' });
      setResetPassword('');
      setResetUserId(null);
      setResetOpen(false);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to reset password' });
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Delete user "${u.username}"?`)) return;
    try {
      await deleteUser(u.id);
      setAlert({ type: 'success', message: 'User deleted' });
      await refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete user' });
    }
  }

  function openEdit(u) {
    setEditForm({
      username: u.username,
      role: u.role,
      full_name: u.full_name || '',
      email: u.email || '',
      phone_number: u.phone_number || '',
    });
    setEditingId(u.id);
    setEditOpen(true);
  }

  function openReset(u) {
    setResetUserId(u.id);
    setResetPassword('');
    setResetOpen(true);
  }

  const roleSelect = (value, onChange) => (
    <select value={value} onChange={onChange} className={inputClassName()}>
      <option value="staff">Staff</option>
      <option value="trainer">Trainer</option>
      <option value="project_manager">Project Manager</option>
      <option value="administrator">Administrator</option>
    </select>
  );

  return (
    <div className="page-shell">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <PageHeader
        title="Users"
        description="Administrator access — manage system accounts and roles."
      >
        {writable && <Button onClick={() => setCreateOpen(true)}>Add user</Button>}
      </PageHeader>

      <div className="page-body">
      {list.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Create accounts for staff, trainers, and project managers."
          action={writable ? <Button onClick={() => setCreateOpen(true)}>Add user</Button> : null}
        />
      ) : (
        <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
          <table className="data-table">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Username</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Phone</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border">Created</th>
              {writable && <th className="p-3 border">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="odd:bg-white even:bg-slate-50">
                <td className="p-3 border font-medium text-slate-900">{u.full_name || '—'}</td>
                <td className="p-3 border">
                  {u.username}
                  {u.id === currentUser?.id && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                </td>
                <td className="p-3 border text-slate-600">{u.email || '—'}</td>
                <td className="p-3 border text-slate-600">{u.phone_number || '—'}</td>
                <td className="p-3 border capitalize">{formatRole(u.role)}</td>
                <td className="p-3 border text-slate-600">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                {writable && (
                  <td className="p-3 border">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" type="button" onClick={() => openEdit(u)}>Edit</Button>
                      <Button size="sm" variant="secondary" type="button" onClick={() => openReset(u)}>Reset password</Button>
                      <Button
                        size="sm"
                        variant="danger"
                        type="button"
                        disabled={u.id === currentUser?.id}
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
      )}
      </div>

      <Modal title="Add user" open={createOpen} onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="grid gap-3">
          <input
            required
            minLength={2}
            placeholder="Full name"
            value={createForm.full_name}
            onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
            className={inputClassName()}
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            className={inputClassName()}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={createForm.phone_number}
            onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
            className={inputClassName()}
          />
          <input
            required
            minLength={3}
            placeholder="Username"
            value={createForm.username}
            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            className={inputClassName()}
          />
          <input
            required
            minLength={6}
            type="password"
            placeholder="Password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            className={inputClassName()}
          />
          {roleSelect(createForm.role, (e) => setCreateForm({ ...createForm, role: e.target.value }))}
          <FormActions onCancel={() => setCreateOpen(false)} submitLabel="Create" className="" />
        </form>
      </Modal>

      <Modal title="Edit user" open={editOpen} onClose={() => setEditOpen(false)}>
        <form onSubmit={handleEdit} className="grid gap-3">
          <input
            required
            minLength={2}
            placeholder="Full name"
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            className={inputClassName()}
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            className={inputClassName()}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={editForm.phone_number}
            onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
            className={inputClassName()}
          />
          <input
            required
            minLength={3}
            placeholder="Username"
            value={editForm.username}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            className={inputClassName()}
          />
          {roleSelect(editForm.role, (e) => setEditForm({ ...editForm, role: e.target.value }))}
          <FormActions onCancel={() => setEditOpen(false)} submitLabel="Save" className="" />
        </form>
      </Modal>

      <Modal title="Reset password" open={resetOpen} onClose={() => setResetOpen(false)}>
        <form onSubmit={handleResetPassword} className="grid gap-3">
          <p className="text-sm text-slate-600">Set a new password for this user.</p>
          <input
            required
            minLength={6}
            type="password"
            placeholder="New password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            className={inputClassName()}
          />
          <FormActions onCancel={() => setResetOpen(false)} submitLabel="Reset" className="" />
        </form>
      </Modal>
    </div>
  );
}
