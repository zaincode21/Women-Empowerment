require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('Starting seed...');
  try {
    await pool.query('BEGIN');

    const adminPass = process.env.SEED_ADMIN_PASS || 'admin123';
    const hashed = await bcrypt.hash(adminPass, 10);

    // create admin if not exists
    const userExists = await pool.query('SELECT 1 FROM users WHERE username=$1', ['admin']);
    if (userExists.rows.length === 0) {
      await pool.query('INSERT INTO users (username, password, role) VALUES ($1,$2,$3)', ['admin', hashed, 'administrator']);
    }

    const trainers = [
      { name: 'Jane Doe', phone: '0788123456', email: 'jane.doe@example.com', specialization: 'Entrepreneurship', village: 'Village 5', cell: 'Kigali Cell', sector: 'Gahanga', district: 'Kicukiro', province: 'Kigali', bio: 'Experienced entrepreneurship trainer' },
      { name: 'John Smith', phone: '0788234567', email: 'john.smith@example.com', specialization: 'Financial Literacy', village: 'Nyamirambo', cell: 'Nyamirambo Cell', sector: 'Nyarugenge', district: 'Nyarugenge', province: 'Kigali', bio: 'Financial literacy and savings groups' },
    ];

    for (const t of trainers) {
      const exists = await pool.query('SELECT 1 FROM trainers WHERE email=$1', [t.email]);
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO trainers (name, full_name, phone, email, specialization, village, cell, sector, district, province, bio)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [t.name, t.name, t.phone, t.email, t.specialization, t.village, t.cell, t.sector, t.district, t.province, t.bio]
        );
      }
    }

    await pool.query('COMMIT');
    console.log('Seed completed. Admin user: admin / (see SEED_ADMIN_PASS or default "admin123")');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
