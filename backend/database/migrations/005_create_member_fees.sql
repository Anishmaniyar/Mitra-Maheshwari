-- 005_create_member_fees.sql
-- Membership payment belongs to the FAMILY, not to each member. One payment
-- per family per year (UNIQUE constraint); a failed payment is re-armed for
-- retry rather than duplicated. Status changes only via the verified webhook.
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  transaction_mode TEXT NOT NULL DEFAULT 'manual',
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, year)
);

CREATE INDEX payments_family_year_idx ON payments (family_id, year DESC);
CREATE UNIQUE INDEX payments_transaction_unique ON payments (transaction_id) WHERE transaction_id IS NOT NULL;