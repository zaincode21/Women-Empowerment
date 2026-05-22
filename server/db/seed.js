import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDirectory = path.join(__dirname, 'seeds');

export async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const seedFiles = (await readdir(seedsDirectory)).filter((filename) => filename.endsWith('.sql')).sort();

    for (const filename of seedFiles) {
      const seedSql = await readFile(path.join(seedsDirectory, filename), 'utf8');
      await client.query(seedSql);
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
  seedDatabase()
    .then(async () => {
      await pool.end();
      console.log('Seeds completed successfully.');
    })
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      process.exitCode = 1;
    });
}
