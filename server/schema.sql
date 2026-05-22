-- Legacy schema reference. The active source of truth is server/db/migrations/001_init.sql.

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(50) NOT NULL
);

CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  age INTEGER NOT NULL,
  address TEXT NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  education_level VARCHAR(100) NOT NULL,
  occupation VARCHAR(120) NOT NULL
);

CREATE TABLE trainings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  trainer_name VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(200) NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  training_id INTEGER NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluations (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  progress VARCHAR(200) NOT NULL,
  remarks TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
