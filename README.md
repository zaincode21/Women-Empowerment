# Women Empowerment Monitoring & Evaluation System

A web-based system for NGOs and community organizations to digitize participant records, training programs, attendance tracking, progress monitoring, and reporting.

**Stack:** React + Vite · Node.js + Express · PostgreSQL · Tailwind CSS

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Quick start

### 1. Create the database

```bash
createdb women_empowerment
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT_SECRET
npm install
npm run migrate      # applies db/init.sql
npm run fix-schema   # safe to re-run; patches legacy columns
npm run seed         # creates admin user (default: admin / admin123)
npm run dev          # starts API on http://localhost:4000
```

### 3. Frontend setup

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev          # starts UI on http://localhost:5173
```

The Vite dev server proxies `/api` to the backend, so you can leave `VITE_API_BASE` empty during local development.

### 4. Log in

Open http://localhost:5173 and sign in with:

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

Override the seed password with `SEED_ADMIN_PASS` in `backend/.env` before running `npm run seed`.

## Project structure

```
Women-Empowerment/
├── client/          # React SPA
├── backend/         # Express API + PostgreSQL
└── women_empowerment_system_srd_prd.md   # Requirements spec
```

## Features

- **Participants** — CRUD with search by name
- **Trainers & Trainings** — full management with Rwanda-style address fields
- **Attendance** — record, edit, delete; 80% eligibility analytics
- **Evaluations** — progress tracking with edit/delete
- **Monitoring** — participant progress profiles, attendance rates, achievements, and activity timeline
- **Reports** — summary, attendance, trainings, progress, and evaluation reports with filters and CSV export
- **Certificates** — PNG export with 80% attendance eligibility check
- **Dashboard** — live stats, trends, program analytics charts, recent activity, quick actions
- **Users** (admin only) — create staff/administrator accounts

## Authentication & roles

All API routes (except `/api/auth/login` and `/api/health`) require a JWT bearer token.

| Role | Access |
|---|---|
| `administrator` | Full access + user management |
| `project_manager` | Dashboard, read-only data modules, reports & evaluations |
| `trainer` | Dashboard, attendance (write), trainings & participants (read for attendance forms) |
| `staff` | Participants, trainers, trainings, attendance, evaluations, certificates |

The first registered user (via seed or bootstrap register) becomes administrator. Additional users can only be created by an administrator.

### Demo accounts (after `npm run seed`)

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` (or `SEED_ADMIN_PASS`) | administrator |
| `pm1` | `demo123` (or `SEED_DEMO_PASS`) | project_manager |
| `trainer1` | `demo123` | trainer |
| `staff1` | `demo123` | staff |

## Environment variables

### Backend (`backend/.env`)

| Variable       | Description                          |
|----------------|--------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string         |
| `JWT_SECRET`   | Secret for signing JWT tokens        |
| `PORT`         | API port (default `4000`)            |
| `SEED_ADMIN_PASS` | Optional seed admin password      |

### Client (`client/.env`)

| Variable        | Description                                    |
|-----------------|------------------------------------------------|
| `VITE_API_BASE` | API base URL (optional in dev with Vite proxy) |

## Production build

```bash
cd client && npm run build    # outputs to client/dist
cd backend && npm start       # serve API; point reverse proxy at /api
```

Serve `client/dist` as static files and proxy `/api` requests to the backend.

## API overview

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/auth/login`     | Login                    |
| POST   | `/api/auth/register`  | Register (admin or bootstrap) |
| GET    | `/api/auth/users`     | List users (admin)       |
| PUT    | `/api/auth/users/:id` | Update user (admin)      |
| PUT    | `/api/auth/users/:id/password` | Reset password (admin) |
| DELETE | `/api/auth/users/:id` | Delete user (admin)      |
| GET    | `/api/summary`        | Dashboard summary        |
| CRUD   | `/api/participants`   | Participant management   |
| CRUD   | `/api/trainers`       | Trainer management       |
| CRUD   | `/api/trainings`      | Training management      |
| CRUD   | `/api/attendance`     | Attendance records       |
| CRUD   | `/api/evaluations`    | Evaluation records       |
| GET    | `/api/monitoring/participants` | Monitoring list with progress |
| GET    | `/api/monitoring/participants/:id` | Participant monitoring profile |
| GET    | `/api/monitoring/activities` | Cross-module activity feed |
| GET    | `/api/reports/attendance` | Attendance report (filters: training_id, participant_id, from, to) |
| GET    | `/api/reports/trainings` | Training report (filters: trainer_id, from, to) |
| GET    | `/api/reports/progress` | Progress report (filter: participant_id) |
| GET    | `/api/reports/evaluations` | Evaluation report (filters: participant_id, from, to) |

See `backend/README.md` for additional backend notes.
