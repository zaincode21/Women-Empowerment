# Women Empowerment Backend

Simple Node.js + Express backend for the Women Empowerment Monitoring and Evaluation System.

Setup

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies: `npm install` (from the `backend` folder).
3. Initialize the database: run the SQL in `db/init.sql` against your Postgres instance.
4. Start the server: `npm run dev` for development.

API

Endpoints are implemented under `src/routes/` (auth, participants, trainings, attendance, evaluations).
