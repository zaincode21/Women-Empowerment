const jsonHeaders = {
  'Content-Type': 'application/json',
};

async function request(path, options = {}) {
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '';
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { ...jsonHeaders };

  try {
    const token = localStorage.getItem('we_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    // ignore (SSR or no localStorage)
  }

  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function getSummary() {
  return request('/api/summary');
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

export function getParticipants() {
  return request('/api/participants');
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

export function createAttendance(payload) {
  return request('/api/attendance', {
    method: 'POST',
    body: JSON.stringify(payload),
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
