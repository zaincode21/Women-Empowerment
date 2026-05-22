import { query } from './db/pool.js';

function normalizeParticipant(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    age: row.age,
    address: row.address,
    phone_number: row.phone_number,
    education_level: row.education_level,
    occupation: row.occupation,
  };
}

function normalizeTraining(row) {
  return {
    id: row.id,
    title: row.title,
    trainer_name: row.trainer_name,
    date: row.date,
    location: row.location,
    description: row.description,
  };
}

function normalizeAttendance(row) {
  return {
    id: row.id,
    participant_id: row.participant_id,
    training_id: row.training_id,
    participant_name: row.participant_name,
    training_title: row.training_title,
    status: row.status,
    created_at: row.created_at,
  };
}

function normalizeEvaluation(row) {
  return {
    id: row.id,
    participant_id: row.participant_id,
    participant_name: row.participant_name,
    progress: row.progress,
    remarks: row.remarks,
    created_at: row.created_at,
  };
}

async function summary() {
  const result = await query(
    `
      SELECT
        (SELECT COUNT(*)::int FROM participants) AS participants,
        (SELECT COUNT(*)::int FROM trainings) AS trainings,
        (SELECT COUNT(*)::int FROM attendance) AS attendance,
        (SELECT COUNT(*)::int FROM evaluations) AS evaluations,
        COALESCE(
          ROUND(
            (SELECT COUNT(*)::numeric FROM evaluations) / NULLIF((SELECT COUNT(*)::numeric FROM participants), 0) * 100
          ),
          0
        )::int AS completion_rate,
        (
          SELECT json_build_object(
            'id', id,
            'title', title,
            'trainer_name', trainer_name,
            'date', date,
            'location', location,
            'description', description
          )
          FROM trainings
          ORDER BY date ASC, id ASC
          LIMIT 1
        ) AS next_training
    `,
  );

  return {
    participants: result.rows[0].participants,
    trainings: result.rows[0].trainings,
    attendance: result.rows[0].attendance,
    evaluations: result.rows[0].evaluations,
    completionRate: result.rows[0].completion_rate,
    nextTraining: result.rows[0].next_training,
  };
}

async function listParticipants() {
  const result = await query('SELECT * FROM participants ORDER BY id ASC');
  return result.rows.map(normalizeParticipant);
}

async function createParticipant(payload) {
  const result = await query(
    `
      INSERT INTO participants (full_name, age, address, phone_number, education_level, occupation)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      payload.full_name,
      Number(payload.age),
      payload.address,
      payload.phone_number,
      payload.education_level,
      payload.occupation,
    ],
  );

  return normalizeParticipant(result.rows[0]);
}

async function updateParticipant(id, payload) {
  const result = await query(
    `
      UPDATE participants
      SET full_name = $1,
          age = $2,
          address = $3,
          phone_number = $4,
          education_level = $5,
          occupation = $6
      WHERE id = $7
      RETURNING *
    `,
    [
      payload.full_name,
      Number(payload.age),
      payload.address,
      payload.phone_number,
      payload.education_level,
      payload.occupation,
      id,
    ],
  );

  return result.rows[0] ? normalizeParticipant(result.rows[0]) : null;
}

async function deleteParticipant(id) {
  const result = await query('DELETE FROM participants WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function listTrainings() {
  const result = await query('SELECT * FROM trainings ORDER BY date ASC, id ASC');
  return result.rows.map(normalizeTraining);
}

async function createTraining(payload) {
  const result = await query(
    `
      INSERT INTO trainings (title, trainer_name, date, location, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [payload.title, payload.trainer_name, payload.date, payload.location, payload.description],
  );

  return normalizeTraining(result.rows[0]);
}

async function updateTraining(id, payload) {
  const result = await query(
    `
      UPDATE trainings
      SET title = $1,
          trainer_name = $2,
          date = $3,
          location = $4,
          description = $5
      WHERE id = $6
      RETURNING *
    `,
    [payload.title, payload.trainer_name, payload.date, payload.location, payload.description, id],
  );

  return result.rows[0] ? normalizeTraining(result.rows[0]) : null;
}

async function deleteTraining(id) {
  const result = await query('DELETE FROM trainings WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function listAttendance() {
  const result = await query(
    `
      SELECT
        attendance.id,
        attendance.participant_id,
        attendance.training_id,
        participants.full_name AS participant_name,
        trainings.title AS training_title,
        attendance.status,
        attendance.created_at
      FROM attendance
      JOIN participants ON participants.id = attendance.participant_id
      JOIN trainings ON trainings.id = attendance.training_id
      ORDER BY attendance.created_at DESC, attendance.id DESC
    `,
  );

  return result.rows.map(normalizeAttendance);
}

async function createAttendance(payload) {
  const participantResult = await query('SELECT id, full_name FROM participants WHERE id = $1', [payload.participant_id]);
  const trainingResult = await query('SELECT id, title FROM trainings WHERE id = $1', [payload.training_id]);

  if (!participantResult.rows[0] || !trainingResult.rows[0]) {
    const error = new Error('Participant or training not found');
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `
      INSERT INTO attendance (participant_id, training_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [payload.participant_id, payload.training_id, payload.status],
  );

  return normalizeAttendance({
    ...result.rows[0],
    participant_name: participantResult.rows[0].full_name,
    training_title: trainingResult.rows[0].title,
  });
}

async function listEvaluations() {
  const result = await query(
    `
      SELECT
        evaluations.id,
        evaluations.participant_id,
        participants.full_name AS participant_name,
        evaluations.progress,
        evaluations.remarks,
        evaluations.created_at
      FROM evaluations
      JOIN participants ON participants.id = evaluations.participant_id
      ORDER BY evaluations.created_at DESC, evaluations.id DESC
    `,
  );

  return result.rows.map(normalizeEvaluation);
}

async function createEvaluation(payload) {
  const participantResult = await query('SELECT id, full_name FROM participants WHERE id = $1', [payload.participant_id]);

  if (!participantResult.rows[0]) {
    const error = new Error('Participant not found');
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `
      INSERT INTO evaluations (participant_id, progress, remarks)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [payload.participant_id, payload.progress, payload.remarks],
  );

  return normalizeEvaluation({
    ...result.rows[0],
    participant_name: participantResult.rows[0].full_name,
  });
}

export {
  createAttendance,
  createEvaluation,
  createParticipant,
  createTraining,
  deleteParticipant,
  deleteTraining,
  listAttendance,
  listEvaluations,
  listParticipants,
  listTrainings,
  summary,
  updateParticipant,
  updateTraining,
};
