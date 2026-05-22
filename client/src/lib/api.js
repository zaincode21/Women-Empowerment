const jsonHeaders = {
  'Content-Type': 'application/json',
};

// In-memory mock store used as a fallback when the backend is not reachable.
const _mock = {
  trainers: [
    { id: 1, full_name: 'Jane Doe', phone_number: '0788123456', email: 'jane.doe@example.com', specialization: 'Entrepreneurship', village: 'Village 5', cell: 'Kigali Cell', sector: 'Gahanga', district: 'Kicukiro', province: 'Kigali' },
    { id: 2, full_name: 'John Smith', phone_number: '0788234567', email: 'john.smith@example.com', specialization: 'Financial Literacy', village: 'Nyamirambo', cell: 'Nyamirambo Cell', sector: 'Nyarugenge', district: 'Nyarugenge', province: 'Kigali' },
  ],
  participants: [
    { id: 1, full_name: 'Amina Hassan', date_of_birth: '1997-04-12', village: 'Village 5', cell: 'Kigali Cell', sector: 'Gahanga', district: 'Kicukiro', province: 'Kigali', address: 'Village 5', phone_number: '0700123456', education_level: 'Primary', occupation: 'Farmer' },
    { id: 2, full_name: 'Beatrice Okello', date_of_birth: '1992-09-02', village: 'Nyamirambo', cell: 'Nyamirambo Cell', sector: 'Nyarugenge', district: 'Nyarugenge', province: 'Kigali', address: 'Sector 3', phone_number: '0700654321', education_level: 'Ordinary Level', occupation: 'Tailor' },
  ],
  trainings: [
    { id: 1, title: 'Entrepreneurship Basics', trainer_name: 'Jane Doe', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), village: 'Village 5', cell: 'Kigali Cell', sector: 'Gahanga', district: 'Kicukiro', province: 'Kigali', location: 'Community Hall', description: 'Starting and running small businesses' },
    { id: 2, title: 'Financial Literacy', trainer_name: 'John Smith', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), village: 'Nyamirambo', cell: 'Nyamirambo Cell', sector: 'Nyarugenge', district: 'Nyarugenge', province: 'Kigali', location: 'Training Center', description: 'Managing personal and business finances' },
  ],
  attendance: [
    { id: 1, participant_id: 1, participant_name: 'Amina Hassan', training_id: 1, training_title: 'Entrepreneurship Basics', status: 'Present', created_at: new Date().toISOString() },
    { id: 2, participant_id: 2, participant_name: 'Beatrice Okello', training_id: 1, training_title: 'Entrepreneurship Basics', status: 'Late', created_at: new Date().toISOString() },
  ],
  evaluations: [
    { id: 1, participant_id: 1, participant_name: 'Amina Hassan', progress: 'Good', remarks: 'Active participation', created_at: new Date().toISOString() },
  ],
  _nextId: 100,
};

function nextId() {
  return _mock._nextId++;
}

async function mockResponse(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  if (path.endsWith('/trainers')) {
    if (method === 'GET') return JSON.parse(JSON.stringify(_mock.trainers));
    if (method === 'POST') {
      const payload = JSON.parse(options.body || '{}');
      const item = { id: nextId(), ...payload };
      _mock.trainers.push(item);
      return item;
    }
  }

  if (path.match(/\/trainers\//) && method === 'PUT') {
    const id = Number(path.split('/').pop());
    const payload = JSON.parse(options.body || '{}');
    const idx = _mock.trainers.findIndex((p) => p.id === id);
    if (idx !== -1) {
      _mock.trainers[idx] = { ..._mock.trainers[idx], ...payload };
      return _mock.trainers[idx];
    }
    throw new Error('Not found');
  }

  if (path.match(/\/trainers\//) && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    _mock.trainers = _mock.trainers.filter((p) => p.id !== id);
    return { success: true };
  }

  if (path.endsWith('/participants')) {
    if (method === 'GET') return JSON.parse(JSON.stringify(_mock.participants));
    if (method === 'POST') {
      const payload = JSON.parse(options.body || '{}');
      const item = { id: nextId(), ...payload };
      _mock.participants.push(item);
      return item;
    }
  }

  if (path.match(/\/participants\//) && method === 'PUT') {
    const id = Number(path.split('/').pop());
    const payload = JSON.parse(options.body || '{}');
    const idx = _mock.participants.findIndex((p) => p.id === id);
    if (idx !== -1) {
      _mock.participants[idx] = { ..._mock.participants[idx], ...payload };
      return _mock.participants[idx];
    }
    throw new Error('Not found');
  }

  if (path.match(/\/participants\//) && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    _mock.participants = _mock.participants.filter((p) => p.id !== id);
    return { success: true };
  }

  if (path.endsWith('/trainings')) {
    if (method === 'GET') return JSON.parse(JSON.stringify(_mock.trainings));
    if (method === 'POST') {
      const payload = JSON.parse(options.body || '{}');
      const item = { id: nextId(), ...payload };
      _mock.trainings.push(item);
      return item;
    }
  }

  if (path.endsWith('/attendance')) {
    if (method === 'GET') return JSON.parse(JSON.stringify(_mock.attendance));
    if (method === 'POST') {
      const payload = JSON.parse(options.body || '{}');
      const participant = _mock.participants.find((p) => p.id === Number(payload.participant_id));
      const training = _mock.trainings.find((t) => t.id === Number(payload.training_id));
      const item = {
        id: nextId(),
        participant_id: Number(payload.participant_id),
        training_id: Number(payload.training_id),
        participant_name: participant ? participant.full_name : String(payload.participant_id),
        training_title: training ? training.title : String(payload.training_id),
        status: payload.status || 'Present',
        created_at: new Date().toISOString(),
      };
      _mock.attendance.push(item);
      return item;
    }
  }

  if (path.endsWith('/evaluations')) {
    if (method === 'GET') return JSON.parse(JSON.stringify(_mock.evaluations));
    if (method === 'POST') {
      const payload = JSON.parse(options.body || '{}');
      const participant = _mock.participants.find((p) => p.id === Number(payload.participant_id));
      const item = {
        id: nextId(),
        participant_id: Number(payload.participant_id),
        participant_name: participant ? participant.full_name : String(payload.participant_id),
        progress: payload.progress || '',
        remarks: payload.remarks || '',
        created_at: new Date().toISOString(),
      };
      _mock.evaluations.push(item);
      return item;
    }
  }

  if (path.endsWith('/summary')) {
    return {
      participants: _mock.participants.length,
      trainings: _mock.trainings.length,
      attendance: _mock.attendance.length,
      evaluations: _mock.evaluations.length,
    };
  }

  // default empty
  return {};
}

async function request(path, options = {}) {
  // Force mock-only mode when you don't want to use the backend.
  const FORCE_MOCK = true;
  if (FORCE_MOCK) return mockResponse(path, options);

  try {
    const response = await fetch(path, {
      headers: jsonHeaders,
      ...options,
    });

    if (!response.ok) {
      // fallback to mock on server error
      console.warn('API request failed, falling back to mock:', path, response.status);
      return mockResponse(path, options);
    }

    return response.json();
  } catch (err) {
    // network error or CORS — use mock data for demos
    console.warn('Fetch error, using mock data for', path, err && err.message);
    return mockResponse(path, options);
  }
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
