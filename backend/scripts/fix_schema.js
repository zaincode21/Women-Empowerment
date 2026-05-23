require('dotenv').config();
const { Pool } = require('pg');

async function fix() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Ensuring trainers table has expected columns...');
    const alters = [
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS name VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS specialization VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS village VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS cell VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS sector VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS district VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS province VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS bio TEXT;`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
    ];
    for (const sql of alters) {
      await pool.query(sql);
    }

    // If there's a full_name column, copy it to name
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='trainers' AND column_name='full_name'");
    if (colRes.rows.length > 0) {
      await pool.query('UPDATE trainers SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL');
      console.log('Copied full_name to name for existing rows');
    }

    console.log('Ensuring participants table has expected columns...');
    const participantAlters = [
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS age INT;`,
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS date_of_birth DATE;`,
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS village VARCHAR(255);`,
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS cell VARCHAR(255);`,
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS sector VARCHAR(255);`,
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS district VARCHAR(255);`,
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS province VARCHAR(255);`,
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
    ];

    for (const sql of participantAlters) {
      await pool.query(sql);
    }

    await pool.query('ALTER TABLE participants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();');

    await pool.query('ALTER TABLE trainings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();');

    console.log('Ensuring evaluations table has expected monitoring columns...');
    const evaluationAlters = [
      `ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS achievements TEXT;`,
      `ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS follow_up TEXT;`,
      `ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP;`,
      `ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
    ];
    for (const sql of evaluationAlters) {
      await pool.query(sql);
    }

    console.log('Ensuring attendance table has an expected timestamp column...');
    await pool.query('ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();');

    const attendanceCols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='attendance' AND column_name IN ('created_at', 'recorded_at')"
    );
    const hasCreatedAt = attendanceCols.rows.some((row) => row.column_name === 'created_at');
    const hasRecordedAt = attendanceCols.rows.some((row) => row.column_name === 'recorded_at');

    if (hasCreatedAt && hasRecordedAt) {
      await pool.query('UPDATE attendance SET created_at = recorded_at WHERE created_at IS NULL AND recorded_at IS NOT NULL');
      console.log('Copied recorded_at values into created_at for existing attendance rows');
    }

    console.log('Schema fix complete');
  } catch (err) {
    console.error('Schema fix failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

fix();
