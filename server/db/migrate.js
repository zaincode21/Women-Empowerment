import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.join(__dirname, 'migrations');

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function migrateDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensureMigrationTable(client);

    const appliedMigrations = await client.query('SELECT filename FROM schema_migrations ORDER BY filename ASC');
    const appliedSet = new Set(appliedMigrations.rows.map((row) => row.filename));
    const migrationFiles = (await readdir(migrationsDirectory)).filter((filename) => filename.endsWith('.sql')).sort();

    for (const filename of migrationFiles) {
      if (appliedSet.has(filename)) {
        continue;
      }

      const migrationSql = await readFile(path.join(migrationsDirectory, filename), 'utf8');
      await client.query(migrationSql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase()
    .then(async () => {
      await pool.end();
      console.log('Migrations completed successfully.');
    })
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      process.exitCode = 1;
    });
}
