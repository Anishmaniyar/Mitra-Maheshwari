-- 002_create_members.sql
-- Members hold the imported community data. Every member belongs to exactly
-- one family; at most one member per family is the head (partial unique index).
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  -- Normalized E.164 digits without "+", e.g. 919876543210
  mobile TEXT NOT NULL,
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  age INTEGER CHECK (age > 0 AND age < 130),
  occupation TEXT,
  area TEXT,
  pan_name TEXT,
  pan_number TEXT,
  created_by TEXT,
  created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  modified_by TEXT,
  modified_on TIMESTAMPTZ,
  is_active_member BOOLEAN NOT NULL DEFAULT true,
  family_id INTEGER NOT NULL REFERENCES families(id),
  head_id INTEGER REFERENCES members(id),
  is_head BOOLEAN NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX members_mobile_unique ON members (mobile);
CREATE UNIQUE INDEX members_pan_number_unique ON members (pan_number) WHERE pan_number IS NOT NULL;
CREATE INDEX members_family_id_idx ON members (family_id);
CREATE INDEX members_name_idx ON members (lower(first_name), lower(last_name));
-- At most one family head per family
CREATE UNIQUE INDEX one_head_per_family ON members (family_id) WHERE is_head = true;