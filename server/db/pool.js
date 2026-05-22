import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/women_empowerment';

const pool = new Pool({
  connectionString,
});

async function query(text, parameters = []) {
  return pool.query(text, parameters);
}

export { pool, query };
