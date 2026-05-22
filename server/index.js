import express from 'express';
import { migrateDatabase } from './db/migrate.js';
import {
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
} from './store.js';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());

const wrap = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

app.get('/api/health', wrap(async (_request, response) => {
  response.json({ status: 'ok' });
}));

app.get('/api/summary', wrap(async (_request, response) => {
  response.json(await summary());
}));

app.get('/api/participants', wrap(async (_request, response) => {
  response.json(await listParticipants());
}));

app.post('/api/participants', wrap(async (request, response) => {
  const participant = await createParticipant(request.body);
  response.status(201).json(participant);
}));

app.put('/api/participants/:id', wrap(async (request, response) => {
  const participant = await updateParticipant(Number(request.params.id), request.body);
  if (!participant) {
    response.status(404).json({ message: 'Participant not found' });
    return;
  }

  response.json(participant);
}));

app.delete('/api/participants/:id', wrap(async (request, response) => {
  const removed = await deleteParticipant(Number(request.params.id));
  if (!removed) {
    response.status(404).json({ message: 'Participant not found' });
    return;
  }

  response.status(204).send();
}));

app.get('/api/trainings', wrap(async (_request, response) => {
  response.json(await listTrainings());
}));

app.post('/api/trainings', wrap(async (request, response) => {
  const training = await createTraining(request.body);
  response.status(201).json(training);
}));

app.put('/api/trainings/:id', wrap(async (request, response) => {
  const training = await updateTraining(Number(request.params.id), request.body);
  if (!training) {
    response.status(404).json({ message: 'Training not found' });
    return;
  }

  response.json(training);
}));

app.delete('/api/trainings/:id', wrap(async (request, response) => {
  const removed = await deleteTraining(Number(request.params.id));
  if (!removed) {
    response.status(404).json({ message: 'Training not found' });
    return;
  }

  response.status(204).send();
}));

app.get('/api/attendance', wrap(async (_request, response) => {
  response.json(await listAttendance());
}));

app.post('/api/attendance', wrap(async (request, response) => {
  const record = await createAttendance(request.body);
  response.status(201).json(record);
}));

app.get('/api/evaluations', wrap(async (_request, response) => {
  response.json(await listEvaluations());
}));

app.post('/api/evaluations', wrap(async (request, response) => {
  const evaluation = await createEvaluation(request.body);
  response.status(201).json(evaluation);
}));

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
  });
});

await migrateDatabase();

if (process.env.NODE_ENV === 'production') {
  const staticFilesPath = new URL('../client/dist', import.meta.url).pathname;
  app.use(express.static(staticFilesPath));
  app.get('*', (_request, response) => {
    response.sendFile(`${staticFilesPath}/index.html`);
  });
}

app.listen(port, () => {
  console.log(`Women Empowerment Monitoring System API running on port ${port}`);
});
