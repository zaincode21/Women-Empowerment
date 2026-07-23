export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('we_user') || 'null');
  } catch {
    return null;
  }
}

export function isAdmin() {
  const role = getUser()?.role;
  return typeof role === 'string' && role.trim().toLowerCase() === 'administrator';
}

export function getToken() {
  return localStorage.getItem('we_token');
}

export { ROLES, canAccess, canWrite, hasRole } from './permissions';
