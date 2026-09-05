-- 003_create_auth_accounts.sql
-- An imported member record and an authenticated application account are
-- distinct concepts. The account is created only after OTP verification proves
-- the person controls the mobile number. JWT sessions are stateless, so no
-- session table is needed.
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  mobile TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);