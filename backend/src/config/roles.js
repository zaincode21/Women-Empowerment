const ROLES = ['administrator', 'project_manager', 'trainer', 'staff'];

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
};

function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toLowerCase() : role;
}

function canAccess(module, role, action = 'read') {
  const perms = PERMISSIONS[module];
  const normalized = normalizeRole(role);
  if (!perms || !normalized) return false;
  const allowed = perms[action] || perms.read || [];
  return allowed.includes(normalized);
}

function isValidRole(role) {
  return ROLES.includes(normalizeRole(role));
}

module.exports = { ROLES, PERMISSIONS, canAccess, isValidRole, normalizeRole };
