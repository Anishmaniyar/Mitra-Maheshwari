-- Development seed data — clearly fake, for local testing only.
-- Relies on TRUNCATE ... RESTART IDENTITY so serial ids are deterministic:
-- families get ids 1..3 and members 1..6 in insert order.

TRUNCATE payments, otps, accounts, members, families RESTART IDENTITY CASCADE;

-- Family 1: Mehta — head Rajesh (member 1), demo mobile 9876543210
INSERT INTO families (created_by) VALUES ('seed');

INSERT INTO members
  (first_name, middle_name, last_name, mobile, blood_group, age, occupation, area,
   pan_name, pan_number, created_by, family_id, head_id, is_head)
VALUES
  ('Rajesh', 'Kumar', 'Mehta', '919876543210', 'O+', 48, 'Business', 'Sector 14',
   'Rajesh Kumar Mehta', 'ABCDE1234F', 'seed', 1, NULL, true),
  ('Sunita', NULL, 'Mehta', '919876543211', 'B+', 44, 'Homemaker', 'Sector 14',
   NULL, NULL, 'seed', 1, 1, false),
  ('Arjun', NULL, 'Mehta', '919876543212', 'A+', 21, 'Student', 'Sector 14',
   NULL, NULL, 'seed', 1, 1, false);

UPDATE members SET head_id = id WHERE id = 1;

-- Family 2: Sharma — head Amit (member 4)
INSERT INTO families (created_by) VALUES ('seed');

INSERT INTO members
  (first_name, middle_name, last_name, mobile, blood_group, age, occupation, area,
   pan_name, pan_number, created_by, family_id, head_id, is_head)
VALUES
  ('Amit', NULL, 'Sharma', '919812345670', 'AB+', 52, 'Government Service', 'Sector 8',
   'Amit Sharma', 'FGHIJ5678K', 'seed', 2, NULL, true),
  ('Priya', NULL, 'Sharma', '919812345671', 'O-', 49, 'Teacher', 'Sector 8',
   NULL, NULL, 'seed', 2, 4, false);

UPDATE members SET head_id = id WHERE id = 4;

-- Family 3: Singh — head Gurpreet (member 6)
INSERT INTO families (created_by) VALUES ('seed');

INSERT INTO members
  (first_name, middle_name, last_name, mobile, blood_group, age, occupation, area,
   pan_name, pan_number, created_by, family_id, head_id, is_head)
VALUES
  ('Gurpreet', NULL, 'Singh', '919711223344', 'B+', 45, 'Transport', 'Sector 17',
   'Gurpreet Singh', 'VWXYZ7890N', 'seed', 3, NULL, true);

UPDATE members SET head_id = id WHERE id = 6;

-- Payment history
INSERT INTO payments (family_id, year, amount, currency, transaction_mode, transaction_id, status)
VALUES
  (1, 2025, 1000, 'INR', 'cash', 'TXN-2025-0001', 'paid'),
  (1, 2026, 1000, 'INR', 'manual', NULL, 'pending'),
  (2, 2025, 1000, 'INR', 'cash', 'TXN-2025-0002', 'paid');