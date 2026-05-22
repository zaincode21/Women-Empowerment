# Women Empowerment Monitoring and Evaluation System

This workspace contains a full-stack implementation split into a root backend and a standalone frontend package in `client/`.

## Layout

- `server/` Express API and PostgreSQL migration/seed scripts
- `client/` React + Vite + Tailwind CSS v3 frontend

## Run

1. Install root dependencies.
2. Install client dependencies.
3. Run `npm run db:migrate`.
4. Run `npm run db:seed`.
5. Start the full app with `npm run dev`.

To start only the frontend, run `npm run dev` inside `client/`.
