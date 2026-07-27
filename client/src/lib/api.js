import { getToken } from './authStorage';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

async function request(path, options = {}) {
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '';
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { ...jsonHeaders };

  try {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    // ignore (SSR or no sessionStorage)
  }

  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    try {
      const parsed = JSON.parse(message);
      throw new Error(parsed.error || message || `Request failed with status ${response.status}`);
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.startsWith('{')) throw e;
      throw new Error(message || `Request failed with status ${response.status}`);
    }
  }

  return response.json();
}

export function getSummary() {
  return request('/api/summary');
}

export function getMonitoringParticipants(q) {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return request(`/api/monitoring/participants${query}`);
}

export function getParticipantMonitoring(id) {
  return request(`/api/monitoring/participants/${id}`);
}

export function getMonitoringActivities(params = {}) {
  const search = new URLSearchParams();
  if (params.participant_id) search.set('participant_id', params.participant_id);
  if (params.limit) search.set('limit', params.limit);
  const query = search.toString();
  return request(`/api/monitoring/activities${query ? `?${query}` : ''}`);
}

function reportQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getAttendanceReport(params = {}) {
  return request(`/api/reports/attendance${reportQuery(params)}`);
}

export function getTrainingsReport(params = {}) {
  return request(`/api/reports/trainings${reportQuery(params)}`);
}

export function getProgressReport(params = {}) {
  return request(`/api/reports/progress${reportQuery(params)}`);
}

export function getEvaluationsReport(params = {}) {
  return request(`/api/reports/evaluations${reportQuery(params)}`);
}

export function getTrainers() {
  return request('/api/trainers');
}

export function createTrainer(payload) {
  return request('/api/trainers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTrainer(id, payload) {
  return request(`/api/trainers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteTrainer(id) {
  return request(`/api/trainers/${id}`, {
    method: 'DELETE',
  });
}

export function getParticipants(q, status) {
  const search = new URLSearchParams();
  if (q) search.set('q', q);
  if (status) search.set('status', status);
  const query = search.toString();
  return request(`/api/participants${query ? `?${query}` : ''}`);
}

export function updateParticipantStatus(id, status) {
  return request(`/api/participants/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function getMyPortal() {
  return request('/api/me/portal');
}

export function forgotPassword(email) {
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '';
  return fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email }),
  }).then(async (response) => {
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      try {
        const parsed = JSON.parse(message);
        throw new Error(parsed.error || message || 'Request failed');
      } catch (e) {
        if (e instanceof Error && e.message && !e.message.startsWith('{')) throw e;
        throw new Error(message || 'Request failed');
      }
    }
    return response.json();
  });
}

export function resetPassword(token, password) {
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '';
  return fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ token, password }),
  }).then(async (response) => {
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      try {
        const parsed = JSON.parse(message);
        throw new Error(parsed.error || message || 'Request failed');
      } catch (e) {
        if (e instanceof Error && e.message && !e.message.startsWith('{')) throw e;
        throw new Error(message || 'Request failed');
      }
    }
    return response.json();
  });
}

export function getParticipantTrainings(id) {
  return request(`/api/participants/${id}/trainings`);
}

export function registerParticipant(payload) {
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '';
  return fetch(`${API_BASE}/api/participants/register`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  }).then(async (response) => {
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      try {
        const parsed = JSON.parse(message);
        throw new Error(parsed.error || message || `Request failed with status ${response.status}`);
      } catch (e) {
        if (e instanceof Error && e.message && !e.message.startsWith('{')) throw e;
        throw new Error(message || `Request failed with status ${response.status}`);
      }
    }
    return response.json();
  });
}

export function getPublicTrainings() {
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '';
  return fetch(`${API_BASE}/api/trainings/public`).then(async (response) => {
    if (!response.ok) throw new Error('Failed to load trainings');
    return response.json();
  });
}

export function createParticipant(payload) {
  return request('/api/participants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateParticipant(id, payload) {
  return request(`/api/participants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteParticipant(id) {
  return request(`/api/participants/${id}`, {
    method: 'DELETE',
  });
}

export function getTrainings() {
  return request('/api/trainings');
}

export function createTraining(payload) {
  return request('/api/trainings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTraining(id, payload) {
  return request(`/api/trainings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteTraining(id) {
  return request(`/api/trainings/${id}`, {
    method: 'DELETE',
  });
}

export function getAttendance() {
  return request('/api/attendance');
}

export function getTrainingParticipants(trainingId) {
  return request(`/api/attendance/training/${trainingId}/participants`);
}

export function enrollTrainingParticipants(trainingId, participantIds) {
  return request(`/api/attendance/training/${trainingId}/participants`, {
    method: 'POST',
    body: JSON.stringify({ participant_ids: participantIds }),
  });
}

export function unenrollTrainingParticipant(trainingId, participantId) {
  return request(`/api/attendance/training/${trainingId}/participants/${participantId}`, {
    method: 'DELETE',
  });
}

export function createAttendance(payload) {
  return request('/api/attendance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAttendance(id, payload) {
  return request(`/api/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAttendance(id) {
  return request(`/api/attendance/${id}`, {
    method: 'DELETE',
  });
}

export function getEvaluations() {
  return request('/api/evaluations');
}

export function createEvaluation(payload) {
  return request('/api/evaluations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateEvaluation(id, payload) {
  return request(`/api/evaluations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteEvaluation(id) {
  return request(`/api/evaluations/${id}`, {
    method: 'DELETE',
  });
}

export function getUsers() {
  return request('/api/auth/users');
}

export function registerUser(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(id, payload) {
  return request(`/api/auth/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id) {
  return request(`/api/auth/users/${id}`, {
    method: 'DELETE',
  });
}

export function resetUserPassword(id, password) {
  return request(`/api/auth/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
}
