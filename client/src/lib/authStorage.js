const TOKEN_KEY = 'we_token';
const USER_KEY = 'we_user';

/** Session-only storage — cleared when the browser tab/window closes. */
export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getUserRaw() {
  try {
    return sessionStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function setUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/** Remove legacy persistent auth from older builds. */
export function clearLegacyAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('we_remember');
  } catch {
    // ignore
  }
}

export function isAuthenticated() {
  return Boolean(getToken() && getUserRaw());
}
