import { getUser } from './auth';

export const ROLES = ['administrator', 'project_manager', 'trainer', 'staff', 'participant'];

const PERMISSIONS = {
  dashboard: {
    read: ['administrator', 'project_manager', 'trainer', 'staff'],
    write: ['administrator', 'project_manager', 'trainer', 'staff'],
  },
  participants: {
    read: ['administrator', 'project_manager', 'trainer', 'staff'],
    write: ['administrator', 'staff'],
  },
  trainers: {
    read: ['administrator', 'project_manager', 'staff'],
    write: ['administrator', 'staff'],
  },
  trainings: {
    read: ['administrator', 'project_manager', 'trainer', 'staff'],
    write: ['administrator', 'staff'],
  },
  attendance: {
    read: ['administrator', 'project_manager', 'trainer', 'staff'],
    write: ['administrator', 'staff', 'trainer'],
  },
  evaluations: {
    read: ['administrator', 'project_manager', 'staff'],
    write: ['administrator', 'staff'],
  },
  monitoring: {
    read: ['administrator', 'project_manager', 'trainer', 'staff'],
    write: ['administrator', 'staff'],
  },
  reports: {
    read: ['administrator', 'project_manager'],
    write: ['administrator', 'project_manager'],
  },
  users: {
    read: ['administrator'],
    write: ['administrator'],
  },
  certificates: {
    read: ['administrator', 'staff'],
    write: ['administrator', 'staff'],
  },
  portal: {
    read: ['participant'],
    write: ['participant'],
  },
};

function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toLowerCase() : role;
}

export function canAccess(module, action = 'read') {
  const role = normalizeRole(getUser()?.role);
  const perms = PERMISSIONS[module];
  if (!perms || !role) return false;
  const allowed = perms[action] || perms.read || [];
  return allowed.includes(role);
}

export function canWrite(module) {
  return canAccess(module, 'write');
}

export function hasRole(...roles) {
  const role = normalizeRole(getUser()?.role);
  return role && roles.map(normalizeRole).includes(role);
}

export const ROUTE_MODULES = {
  '/': 'dashboard',
  '/portal': 'portal',
  '/participants': 'participants',
  '/trainers': 'trainers',
  '/trainings': 'trainings',
  '/attendance': 'attendance',
  '/evaluations': 'evaluations',
  '/monitoring': 'monitoring',
  '/reports': 'reports',
  '/certificates': 'certificates',
  '/users': 'users',
};
