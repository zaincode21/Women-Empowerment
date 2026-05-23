# Women Empowerment Backend

Simple Node.js + Express backend for the Women Empowerment Monitoring and Evaluation System.

Setup

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies: `npm install` (from the `backend` folder).
3. Initialize the database: run the SQL in `db/init.sql` against your Postgres instance.
4. Start the server: `npm run dev` for development.

Running frontend + backend together

1. Configure backend `.env` (`DATABASE_URL`, `JWT_SECRET`).
2. In the `client` folder copy `.env.example` to `.env` and set `VITE_USE_MOCK=false` and `VITE_API_BASE=http://localhost:4000`.
3. Start the backend:

```bash
cd backend
npm install
npm run dev
```

4. Start the frontend in a second terminal:

```bash
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api` to the backend (port 4000) so relative API calls in the frontend will reach the backend.

Authentication

The frontend supports a mock login mode (default). To enable real backend auth, disable mock in `client/.env` and use the login form to register/login. The login flow will store a JWT in `localStorage` as `we_token` and the frontend will send it as `Authorization: Bearer <token>` for mutating requests.

API

Endpoints are implemented under `src/routes/` (auth, participants, trainings, attendance, evaluations).
