-- Database initialization for Women Empowerment system
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  age INT,
  date_of_birth DATE,
  village VARCHAR(255),
  cell VARCHAR(255),
  sector VARCHAR(255),
  district VARCHAR(255),
  province VARCHAR(255),
  address TEXT,
  phone_number VARCHAR(50),
  email VARCHAR(255) UNIQUE,
  education_level VARCHAR(100),
  occupation VARCHAR(100),
  password VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  specialization VARCHAR(255),
  village VARCHAR(255),
  cell VARCHAR(255),
  sector VARCHAR(255),
  district VARCHAR(255),
  province VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL,
  trainer_name VARCHAR(255),
  date DATE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  village VARCHAR(255),
  cell VARCHAR(255),
  sector VARCHAR(255),
  district VARCHAR(255),
  province VARCHAR(255),
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id SERIAL PRIMARY KEY,
  training_id INT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  participant_id INT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (training_id, participant_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  participant_id INT REFERENCES participants(id) ON DELETE CASCADE,
  training_id INT REFERENCES trainings(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  participant_id INT REFERENCES participants(id) ON DELETE CASCADE,
  training_id INT REFERENCES trainings(id) ON DELETE SET NULL,
  progress TEXT,
  remarks TEXT,
  achievements TEXT,
  follow_up TEXT,
  next_review_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_snapshots (
  id SERIAL PRIMARY KEY,
  period_type VARCHAR(20) NOT NULL,
  period_label VARCHAR(100) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  trigger_source VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  account_type VARCHAR(20) NOT NULL,
  account_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
