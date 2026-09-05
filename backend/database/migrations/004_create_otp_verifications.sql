-- 004_create_otp_verifications.sql
-- OTPs are stored SHA-256 hashed, never in plaintext. Attempt and resend
-- limits are enforced at the application layer and tracked here.
CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  mobile TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  resend_count INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX otps_mobile_created_idx ON otps (mobile, created_at DESC);