# Women Empowerment Backend

Node.js + Express API for the Women Empowerment Monitoring and Evaluation System.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, and optionally `PORT`.
2. Create a PostgreSQL database: `createdb women_empowerment`
3. Install dependencies: `npm install`
4. Initialize schema:
   ```bash
   npm run migrate      # runs db/init.sql
   npm run fix-schema   # patches legacy databases (safe to re-run)
   npm run seed         # creates admin user (admin / admin123 by default)
   ```
5. Start the server: `npm run dev`

## Scripts

| Script            | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start with nodemon             |
| `npm start`       | Start production server        |
| `npm run migrate` | Apply `db/init.sql`            |
| `npm run fix-schema` | Patch legacy column drift   |
| `npm run seed`    | Seed admin user + sample data  |

## Running with the frontend

1. Start the backend (`npm run dev` in this folder).
2. In `client/`, copy `.env.example` to `.env` and run `npm run dev`.
3. The Vite dev server proxies `/api` to port 4000.

## Authentication

- `POST /api/auth/login` — returns JWT + user object
- `POST /api/auth/register` — bootstrap (first user) or admin-only thereafter
- `GET /api/auth/users` — list users (administrator only)

All data endpoints require `Authorization: Bearer <token>`.

## API routes

Implemented under `src/routes/`:

- `auth` — login, register, user list
- `participants` — CRUD + `?q=` name search
- `trainers` — CRUD
- `trainings` — CRUD
- `attendance` — CRUD
- `evaluations` — CRUD
- `GET /api/summary` — dashboard counts, trends, recent activity
