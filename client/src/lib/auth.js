import { getToken, getUserRaw, clearAuth } from './authStorage';

export function getUser() {
  try {
    return JSON.parse(getUserRaw() || 'null');
  } catch {
    return null;
  }
}

export function isAdmin() {
  const role = getUser()?.role;
  return typeof role === 'string' && role.trim().toLowerCase() === 'administrator';
}

export { getToken, clearAuth };

export { ROLES, canAccess, canWrite, hasRole } from './permissions';
