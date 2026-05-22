require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

const authRoutes = require('./routes/auth');
const participantsRoutes = require('./routes/participants');
const trainingsRoutes = require('./routes/trainings');
const attendanceRoutes = require('./routes/attendance');
const evaluationsRoutes = require('./routes/evaluations');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/evaluations', evaluationsRoutes);

app.get('/api/health', (req, res) => res.json({status: 'ok'}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
