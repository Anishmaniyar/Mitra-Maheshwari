-- 001_create_families.sql
-- A family is the primary membership unit. Payments and members attach to it.
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  created_by TEXT,
  created_on TIMESTAMPTZ NOT NULL DEFAULT now()
);