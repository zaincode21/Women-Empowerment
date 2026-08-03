require('dotenv').config();
const { Pool } = require('pg');

async function fix() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Ensuring trainers table has expected columns...');
    const alters = [
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);`,
      `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);`,
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

    // Sync legacy name/phone columns with full_name/phone_number
    await pool.query('UPDATE trainers SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL');
    await pool.query('UPDATE trainers SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL');
    await pool.query('UPDATE trainers SET phone_number = phone WHERE phone_number IS NULL AND phone IS NOT NULL');
    await pool.query('UPDATE trainers SET phone = phone_number WHERE phone IS NULL AND phone_number IS NOT NULL');
    console.log('Synced trainer name/phone columns');

    console.log('Ensuring trainings table has expected columns...');
    const trainingAlters = [
      `ALTER TABLE trainings ADD COLUMN IF NOT EXISTS trainer_name VARCHAR(255);`,
      `ALTER TABLE trainings ADD COLUMN IF NOT EXISTS date DATE;`,
      `ALTER TABLE trainings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
    ];
    for (const sql of trainingAlters) {
      await pool.query(sql);
    }
    await pool.query('UPDATE trainings SET date = start_date::date WHERE date IS NULL AND start_date IS NOT NULL');

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
      `ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS training_id INT REFERENCES trainings(id) ON DELETE SET NULL;`,
    ];
    for (const sql of evaluationAlters) {
      await pool.query(sql);
    }

    console.log('Ensuring report_snapshots table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_snapshots (
        id SERIAL PRIMARY KEY,
        period_type VARCHAR(20) NOT NULL,
        period_label VARCHAR(100) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        trigger_source VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        summary JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Ensuring training_enrollments table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_enrollments (
        id SERIAL PRIMARY KEY,
        training_id INT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
        participant_id INT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (training_id, participant_id)
      )
    `);
    await pool.query(`
      INSERT INTO training_enrollments (training_id, participant_id)
      SELECT DISTINCT training_id, participant_id
      FROM attendance
      ON CONFLICT (training_id, participant_id) DO NOTHING
    `);
    console.log('Backfilled enrollments from existing attendance records');

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

    await pool.query("UPDATE users SET role = LOWER(TRIM(role)) WHERE role IS NOT NULL");
    console.log('Normalized user roles to lowercase');

    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);');
    console.log('Ensured users profile columns exist');

    await pool.query('ALTER TABLE participants ADD COLUMN IF NOT EXISTS password VARCHAR(255);');
    await pool.query('ALTER TABLE participants ADD COLUMN IF NOT EXISTS email VARCHAR(255);');
    await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'`);
    await pool.query(`UPDATE participants SET status='approved' WHERE status IS NULL OR TRIM(status)=''`);
    console.log('Ensured participants.password, email, and status columns exist');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        account_type VARCHAR(20) NOT NULL,
        account_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Ensured password_reset_tokens table exists');

    // Backfill demo emails for staff users missing email
    await pool.query(`
      UPDATE users
      SET email = LOWER(username) || '@wep.rw'
      WHERE email IS NULL OR TRIM(email) = ''
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
      ON users (LOWER(email))
      WHERE email IS NOT NULL AND TRIM(email) <> ''
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS participants_email_unique
      ON participants (LOWER(email))
      WHERE email IS NOT NULL AND TRIM(email) <> ''
    `);
    console.log('Ensured unique email indexes');

    console.log('Schema fix complete');
  } catch (err) {
    console.error('Schema fix failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

fix();
