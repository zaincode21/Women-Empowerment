require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEMO_MARKER_PHONE = '0788000001';

function monthsAgo(months, day = 10) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  d.setHours(9, 0, 0, 0);
  return d;
}

function toDate(d) {
  return d.toISOString().slice(0, 10);
}

function toTimestamp(d) {
  return d.toISOString();
}

async function seed() {
  console.log('Starting seed...');
  try {
    await pool.query('BEGIN');

    // Ensure enrollments table exists (in case fix-schema was not run)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_enrollments (
        id SERIAL PRIMARY KEY,
        training_id INT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
        participant_id INT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (training_id, participant_id)
      )
    `);

    const adminPass = process.env.SEED_ADMIN_PASS || 'admin123';
    const hashed = await bcrypt.hash(adminPass, 10);

    const userExists = await pool.query('SELECT 1 FROM users WHERE username=$1', ['admin']);
    if (userExists.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, password, role, email, full_name) VALUES ($1,$2,$3,$4,$5)',
        ['admin', hashed, 'administrator', 'admin@wep.rw', 'System Administrator']
      );
    } else {
      await pool.query(
        `UPDATE users SET email = COALESCE(NULLIF(TRIM(email), ''), 'admin@wep.rw') WHERE username='admin'`
      );
    }

    const demoUsers = [
      { username: 'pm1', role: 'project_manager', email: 'pm1@wep.rw', full_name: 'Project Manager' },
      { username: 'trainer1', role: 'trainer', email: 'trainer1@wep.rw', full_name: 'Demo Trainer' },
      { username: 'staff1', role: 'staff', email: 'staff1@wep.rw', full_name: 'Demo Staff' },
    ];
    const demoPass = process.env.SEED_DEMO_PASS || 'demo123';
    const demoHashed = await bcrypt.hash(demoPass, 10);

    for (const u of demoUsers) {
      const exists = await pool.query('SELECT 1 FROM users WHERE username=$1', [u.username]);
      if (exists.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (username, password, role, email, full_name) VALUES ($1,$2,$3,$4,$5)',
          [u.username, demoHashed, u.role, u.email, u.full_name]
        );
      } else {
        await pool.query(
          `UPDATE users SET email = COALESCE(NULLIF(TRIM(email), ''), $2) WHERE username=$1`,
          [u.username, u.email]
        );
      }
    }

    const trainers = [
      {
        name: 'Alice Mukabaranga',
        phone: '0788111001',
        email: 'alice.mukabaranga@wep.rw',
        specialization: 'Entrepreneurship',
        village: 'Gahanga',
        cell: 'Gahanga',
        sector: 'Gahanga',
        district: 'Kicukiro',
        province: 'Kigali',
        bio: 'Entrepreneurship and small business development facilitator',
      },
      {
        name: 'Grace Uwase',
        phone: '0788111002',
        email: 'grace.uwase@wep.rw',
        specialization: 'Financial Literacy',
        village: 'Nyamirambo',
        cell: 'Rwezamenyo',
        sector: 'Nyamirambo',
        district: 'Nyarugenge',
        province: 'Kigali',
        bio: 'Savings groups and household budgeting trainer',
      },
      {
        name: 'Immaculée Ingabire',
        phone: '0788111003',
        email: 'immaculee.ingabire@wep.rw',
        specialization: 'Leadership',
        village: 'Remera',
        cell: 'Rukiri I',
        sector: 'Remera',
        district: 'Gasabo',
        province: 'Kigali',
        bio: 'Women leadership and community mobilization',
      },
      {
        name: 'Diane Iradukunda',
        phone: '0788111004',
        email: 'diane.iradukunda@wep.rw',
        specialization: 'Digital Skills',
        village: 'Kacyiru',
        cell: 'Kamatamu',
        sector: 'Kacyiru',
        district: 'Gasabo',
        province: 'Kigali',
        bio: 'Digital literacy and mobile money skills',
      },
      {
        name: 'Jeanne Mukamana',
        phone: '0788111005',
        email: 'jeanne.mukamana@wep.rw',
        specialization: 'Gender & GBV Prevention',
        village: 'Kimironko',
        cell: 'Bibare',
        sector: 'Kimironko',
        district: 'Gasabo',
        province: 'Kigali',
        bio: 'Gender equality and GBV awareness facilitator',
      },
    ];

    const trainerIdsByEmail = {};
    for (const t of trainers) {
      const exists = await pool.query('SELECT id FROM trainers WHERE email=$1', [t.email]);
      if (exists.rows.length === 0) {
        const inserted = await pool.query(
          `INSERT INTO trainers (name, full_name, phone, phone_number, email, specialization, village, cell, sector, district, province, bio)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
          [t.name, t.name, t.phone, t.phone, t.email, t.specialization, t.village, t.cell, t.sector, t.district, t.province, t.bio]
        );
        trainerIdsByEmail[t.email] = inserted.rows[0].id;
      } else {
        trainerIdsByEmail[t.email] = exists.rows[0].id;
      }
    }

    const alreadySeeded = await pool.query(
      'SELECT 1 FROM participants WHERE phone_number=$1 LIMIT 1',
      [DEMO_MARKER_PHONE]
    );

    if (alreadySeeded.rows.length > 0) {
      await pool.query('COMMIT');
      console.log('Demo program data already present — skipped re-insert.');
      printCredentials();
      return;
    }

    const participants = [
      { full_name: 'Uwimana Chantal', age: 28, education_level: 'Primary', occupation: 'Market vendor', village: 'Gahanga', cell: 'Gahanga', sector: 'Gahanga', district: 'Kicukiro', province: 'Kigali', phone_number: DEMO_MARKER_PHONE },
      { full_name: 'Mukamana Solange', age: 34, education_level: 'Ordinary Level', occupation: 'Tailor', village: 'Nyamirambo', cell: 'Rwezamenyo', sector: 'Nyamirambo', district: 'Nyarugenge', province: 'Kigali', phone_number: '0788000002' },
      { full_name: 'Ingabire Claudine', age: 22, education_level: 'Advanced Level', occupation: 'Student entrepreneur', village: 'Remera', cell: 'Rukiri I', sector: 'Remera', district: 'Gasabo', province: 'Kigali', phone_number: '0788000003' },
      { full_name: 'Uwase Aline', age: 41, education_level: 'No formal education', occupation: 'Farmer', village: 'Kimironko', cell: 'Bibare', sector: 'Kimironko', district: 'Gasabo', province: 'Kigali', phone_number: '0788000004' },
      { full_name: 'Iradukunda Divine', age: 30, education_level: 'TVET / Vocational', occupation: 'Hairdresser', village: 'Kacyiru', cell: 'Kamatamu', sector: 'Kacyiru', district: 'Gasabo', province: 'Kigali', phone_number: '0788000005' },
      { full_name: 'Nyirahabimana Esperance', age: 37, education_level: 'Primary', occupation: 'Shopkeeper', village: 'Gikondo', cell: 'Kanserege', sector: 'Gikondo', district: 'Kicukiro', province: 'Kigali', phone_number: '0788000006' },
      { full_name: 'Mukeshimana Belange', age: 26, education_level: 'University', occupation: 'Community mobilizer', village: 'Nyarutarama', cell: 'Gasabo', sector: 'Remera', district: 'Gasabo', province: 'Kigali', phone_number: '0788000007' },
      { full_name: 'Umutoni Pacifique', age: 33, education_level: 'Ordinary Level', occupation: 'Soap maker', village: 'Kanombe', cell: 'Kabeza', sector: 'Kanombe', district: 'Kicukiro', province: 'Kigali', phone_number: '0788000008' },
      { full_name: 'Habimana Yvette', age: 29, education_level: 'Advanced Level', occupation: 'Caterer', village: 'Kibagabaga', cell: 'Kibagabaga', sector: 'Kimironko', district: 'Gasabo', province: 'Kigali', phone_number: '0788000009' },
      { full_name: 'Niyonsaba Clarisse', age: 45, education_level: 'Primary', occupation: 'Livestock keeper', village: 'Masaka', cell: 'Masaka', sector: 'Masaka', district: 'Kicukiro', province: 'Kigali', phone_number: '0788000010' },
      { full_name: 'Uwimana Josiane', age: 24, education_level: 'TVET / Vocational', occupation: 'Craftswoman', village: 'Gisozi', cell: 'Gisozi', sector: 'Gisozi', district: 'Gasabo', province: 'Kigali', phone_number: '0788000011' },
      { full_name: 'Mukamana Immaculée', age: 38, education_level: 'No formal education', occupation: 'Vegetable seller', village: 'Muhima', cell: 'Muhima', sector: 'Muhima', district: 'Nyarugenge', province: 'Kigali', phone_number: '0788000012' },
      { full_name: 'Ingabire Nadine', age: 31, education_level: 'University', occupation: 'Cooperative leader', village: 'Kacyiru', cell: 'Kibaza', sector: 'Kacyiru', district: 'Gasabo', province: 'Kigali', phone_number: '0788000013' },
      { full_name: 'Tuyishime Sandrine', age: 27, education_level: 'Ordinary Level', occupation: 'Boutique owner', village: 'Remera', cell: 'Rukiri II', sector: 'Remera', district: 'Gasabo', province: 'Kigali', phone_number: '0788000014' },
      { full_name: 'Uwitonze Liliane', age: 36, education_level: 'Primary', occupation: 'Baker', village: 'Nyamirambo', cell: 'Mumena', sector: 'Nyamirambo', district: 'Nyarugenge', province: 'Kigali', phone_number: '0788000015' },
    ];

    const participantIds = [];
    for (const p of participants) {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - p.age);
      dob.setMonth(0);
      dob.setDate(15);

      const inserted = await pool.query(
        `INSERT INTO participants
          (full_name, age, date_of_birth, village, cell, sector, district, province, address, phone_number, education_level, occupation, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING id`,
        [
          p.full_name,
          p.age,
          toDate(dob),
          p.village,
          p.cell,
          p.sector,
          p.district,
          p.province,
          `${p.village}, ${p.sector}, ${p.district}`,
          p.phone_number,
          p.education_level,
          p.occupation,
          toTimestamp(monthsAgo(5 + Math.floor(Math.random() * 2), 5 + (participantIds.length % 20))),
        ]
      );
      participantIds.push(inserted.rows[0].id);
    }

    const trainingDefs = [
      {
        title: 'Entrepreneurship Fundamentals',
        email: 'alice.mukabaranga@wep.rw',
        monthsAgoStart: 5,
        location: 'Gahanga Community Hall',
        village: 'Gahanga',
        district: 'Kicukiro',
        province: 'Kigali',
        description: 'Business ideation, customer discovery, and basic business planning for women entrepreneurs.',
        enroll: participantIds.slice(0, 8),
      },
      {
        title: 'Financial Literacy & Savings',
        email: 'grace.uwase@wep.rw',
        monthsAgoStart: 4,
        location: 'Nyamirambo Youth Center',
        village: 'Nyamirambo',
        district: 'Nyarugenge',
        province: 'Kigali',
        description: 'Household budgeting, savings groups (Ibimina), and responsible borrowing.',
        enroll: participantIds.slice(2, 11),
      },
      {
        title: 'Leadership and Self Confidence',
        email: 'immaculee.ingabire@wep.rw',
        monthsAgoStart: 3,
        location: 'Remera Training Room',
        village: 'Remera',
        district: 'Gasabo',
        province: 'Kigali',
        description: 'Public speaking, decision-making, and leadership roles in cooperatives.',
        enroll: participantIds.slice(4, 13),
      },
      {
        title: 'Digital Skills for Business',
        email: 'diane.iradukunda@wep.rw',
        monthsAgoStart: 2,
        location: 'Kacyiru ICT Lab',
        village: 'Kacyiru',
        district: 'Gasabo',
        province: 'Kigali',
        description: 'Smartphones for business, mobile money, WhatsApp marketing, and online safety.',
        enroll: participantIds.slice(0, 6).concat(participantIds.slice(10, 15)),
      },
      {
        title: 'Gender Equality & GBV Awareness',
        email: 'jeanne.mukamana@wep.rw',
        monthsAgoStart: 1,
        location: 'Kimironko Sector Office',
        village: 'Kimironko',
        district: 'Gasabo',
        province: 'Kigali',
        description: 'Gender norms, GBV prevention, referral pathways, and community support networks.',
        enroll: participantIds.slice(1, 10),
      },
    ];

    const trainingIds = [];
    for (const td of trainingDefs) {
      const trainerId = trainerIdsByEmail[td.email];
      const trainerRes = await pool.query('SELECT full_name FROM trainers WHERE id=$1', [trainerId]);
      const trainerName = trainerRes.rows[0]?.full_name || '';
      const start = monthsAgo(td.monthsAgoStart, 8);
      const end = monthsAgo(td.monthsAgoStart, 12);

      const inserted = await pool.query(
        `INSERT INTO trainings
          (title, trainer_id, trainer_name, date, start_date, end_date, village, cell, sector, district, province, location, description, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
        [
          td.title,
          trainerId,
          trainerName,
          toDate(start),
          toTimestamp(start),
          toTimestamp(end),
          td.village,
          td.village,
          td.village,
          td.district,
          td.province,
          td.location,
          td.description,
          toTimestamp(monthsAgo(td.monthsAgoStart + 1, 1)),
        ]
      );
      const trainingId = inserted.rows[0].id;
      trainingIds.push({ id: trainingId, enroll: td.enroll, monthsAgoStart: td.monthsAgoStart });

      for (const pid of td.enroll) {
        await pool.query(
          `INSERT INTO training_enrollments (training_id, participant_id, enrolled_at)
           VALUES ($1,$2,$3)
           ON CONFLICT (training_id, participant_id) DO NOTHING`,
          [trainingId, pid, toTimestamp(monthsAgo(td.monthsAgoStart, 3))]
        );
      }
    }

    // Attendance: 4 sessions per training for enrolled participants (mix of Present/Late/Absent)
    const statuses = ['Present', 'Present', 'Present', 'Late', 'Absent'];
    for (const t of trainingIds) {
      for (let session = 0; session < 4; session++) {
        const sessionDay = 8 + session * 3;
        const when = monthsAgo(t.monthsAgoStart, sessionDay);
        for (let i = 0; i < t.enroll.length; i++) {
          const status = statuses[(i + session) % statuses.length];
          await pool.query(
            `INSERT INTO attendance (participant_id, training_id, status, created_at)
             VALUES ($1,$2,$3,$4)`,
            [t.enroll[i], t.id, status, toTimestamp(when)]
          );
        }
      }
    }

    // Evaluations / monitoring progress
    const evaluations = [
      { pidIdx: 0, progress: 'Started a small produce stall', achievements: 'Opened stall at Gahanga market', follow_up: 'Link to micro-savings group', months: 4 },
      { pidIdx: 1, progress: 'Improved cash tracking', achievements: 'Keeps daily sales notebook', follow_up: 'Review pricing next month', months: 3 },
      { pidIdx: 2, progress: 'Joined youth cooperative', achievements: 'Elected as secretary', follow_up: 'Leadership mentoring session', months: 3 },
      { pidIdx: 3, progress: 'Increased farm income', achievements: 'Sold surplus vegetables weekly', follow_up: 'Visit market linkage partner', months: 2 },
      { pidIdx: 4, progress: 'Expanded salon services', achievements: 'Added 2 new clients/week', follow_up: 'Digital booking practice', months: 2 },
      { pidIdx: 5, progress: 'Stable shop inventory', achievements: 'Reduced stock-outs', follow_up: 'Introduce supplier credit terms', months: 2 },
      { pidIdx: 6, progress: 'Leading peer sessions', achievements: 'Facilitated 2 community talks', follow_up: 'Prepare certificate eligibility review', months: 1 },
      { pidIdx: 7, progress: 'Soap production scaled', achievements: 'Produces 40 bars/week', follow_up: 'Packaging quality check', months: 1 },
      { pidIdx: 8, progress: 'Catering contracts secured', achievements: '2 church events booked', follow_up: 'Food hygiene refresher', months: 1 },
      { pidIdx: 9, progress: 'Livestock records started', achievements: 'Weekly health logbook', follow_up: 'Veterinary extension visit', months: 1 },
      { pidIdx: 10, progress: 'Craft sales online', achievements: 'WhatsApp catalog created', follow_up: 'Photo quality coaching', months: 0 },
      { pidIdx: 12, progress: 'Cooperative governance improved', achievements: 'Updated member register', follow_up: 'Quarterly AGM prep', months: 0 },
    ];

    for (const ev of evaluations) {
      const nextReview = monthsAgo(Math.max(ev.months - 1, 0), 20);
      await pool.query(
        `INSERT INTO evaluations
          (participant_id, progress, remarks, achievements, follow_up, next_review_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          participantIds[ev.pidIdx],
          ev.progress,
          'Recorded during field monitoring visit.',
          ev.achievements,
          ev.follow_up,
          toTimestamp(nextReview),
          toTimestamp(monthsAgo(ev.months, 15)),
        ]
      );
    }

    await pool.query('COMMIT');
    console.log('Seed completed with full demo program data.');
    console.log(`  Participants: ${participantIds.length}`);
    console.log(`  Trainers: ${trainers.length}`);
    console.log(`  Trainings: ${trainingIds.length}`);
    console.log('  Enrollments, attendance sessions, and evaluations created.');
    printCredentials();
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function printCredentials() {
  console.log('');
  console.log('Login with email:');
  console.log('  admin@wep.rw / admin123          (administrator)');
  console.log('  pm1@wep.rw / demo123             (project_manager)');
  console.log('  trainer1@wep.rw / demo123        (trainer)');
  console.log('  staff1@wep.rw / demo123          (staff)');
}

seed();
