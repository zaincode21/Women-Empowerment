TRUNCATE TABLE attendance, evaluations, trainings, participants, users RESTART IDENTITY CASCADE;

INSERT INTO users (id, username, password, role) VALUES
  (1, 'admin', '$2b$10$demo-hash-placeholder', 'Administrator'),
  (2, 'manager', '$2b$10$demo-hash-placeholder', 'Project Manager'),
  (3, 'trainer', '$2b$10$demo-hash-placeholder', 'Trainer'),
  (4, 'staff', '$2b$10$demo-hash-placeholder', 'Staff');

INSERT INTO participants (id, full_name, age, address, phone_number, education_level, occupation) VALUES
  (1, 'Amina Hassan', 29, 'Central Ward', '+255700000001', 'Diploma', 'Tailor'),
  (2, 'Nuru Juma', 34, 'South District', '+255700000002', 'Secondary School', 'Farmer'),
  (3, 'Halima Said', 26, 'East Ward', '+255700000003', 'Certificate', 'Shop Owner');

INSERT INTO trainings (id, title, trainer_name, date, location, description) VALUES
  (1, 'Business Skills for Small Enterprises', 'Grace Mzava', '2026-06-04', 'Community Hall A', 'Practical training on bookkeeping, customer service, and pricing.'),
  (2, 'Leadership and Self-Advocacy', 'Faith Mushi', '2026-06-11', 'Training Room 2', 'A workshop for confidence building, communication, and group leadership.');

INSERT INTO attendance (id, participant_id, training_id, status, created_at) VALUES
  (1, 1, 1, 'Present', '2026-05-18T10:00:00.000Z'),
  (2, 2, 1, 'Late', '2026-05-18T10:15:00.000Z');

INSERT INTO evaluations (id, participant_id, progress, remarks, created_at) VALUES
  (1, 1, 'Improved skills', 'Shows strong engagement and has started a small tailoring side business.', '2026-05-19T10:00:00.000Z'),
  (2, 2, 'Needs follow-up', 'Attended the first session and requested extra support on record keeping.', '2026-05-20T10:00:00.000Z');
