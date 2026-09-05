# Mitra Maheshwari Seva Pratishthan — Backend API

Node.js + Express + TypeScript + PostgreSQL (via the `pg` driver). No ORM, no Docker.

```
React PWA
   │  HTTP/REST
   ▼
Express + Node.js
   │
   ├── Controllers  ──  Services  ──  Repositories
   │
   ▼
pg  →  PostgreSQL (installed locally on your machine)
```

## Requirements

- Node.js 20+
- PostgreSQL installed and running **directly on your machine** (no Docker)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

With PostgreSQL running locally, create a database (from `psql`):

```sql
CREATE DATABASE mitra_maheshwari;
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to match your local PostgreSQL install:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mitra_maheshwari
```

Also set `JWT_SECRET` to a long random value and `FRONTEND_URL` to your frontend origin.

### 4. Run migrations

```bash
npm run migrate
```

Migrations live in `database/migrations/*.sql` and are applied in order, tracked in
the `schema_migrations` table.

### 5. Load development seed data (optional)

```bash
npm run seed
```

Loads clearly fake data from `database/seed/development.sql`:
3 families, 6 members, and sample payment history. Demo family head:
**Rajesh Kumar Mehta — mobile 9876543210**.

### 6. Start the server

```bash
npm run dev      # http://localhost:5000 (tsx watch)
npm run build && npm start   # production build
```

## Environment variables

| Variable                  | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `DATABASE_URL`            | Local PostgreSQL connection string             |
| `PORT`                    | API port (default 5000)                        |
| `NODE_ENV`                | development / test / production                |
| `JWT_SECRET`              | JWT signing secret (min 16 chars)              |
| `JWT_EXPIRES_IN`          | Session lifetime, e.g. `30d`                   |
| `FRONTEND_URL`            | Allowed CORS origin(s), comma-separated        |
| `OTP_PROVIDER`            | `console` (dev) or `sms`                       |
| `OTP_TTL_MINUTES` / `OTP_MAX_ATTEMPTS` / `OTP_RESEND_COOLDOWN_SECONDS` / `OTP_MAX_RESENDS` | OTP policies |
| `MEMBERSHIP_FEE` / `CURRENCY` | Family membership fee                     |
| `WEBHOOK_SECRET`          | HMAC secret for payment webhooks               |

## API endpoints

| Method | Path                     | Auth | Purpose                          |
| ------ | ------------------------ | ---- | -------------------------------- |
| GET    | `/health`                | —    | Health + DB readiness            |
| POST   | `/api/members/match`     | —    | Match visitor against records    |
| POST   | `/api/members`           | —    | New registration (family + head) |
| GET    | `/api/me`                | JWT  | Current member profile           |
| PATCH  | `/api/me`                | JWT  | Update own profile               |
| POST   | `/api/auth/send-otp`     | —    | Send OTP (rate limited)          |
| POST   | `/api/auth/resend-otp`   | —    | Resend OTP (rate limited)        |
| POST   | `/api/auth/verify-otp`   | —    | Verify OTP → JWT                 |
| GET    | `/api/family`            | JWT  | Family + members + membership    |
| POST   | `/api/family/members`    | JWT  | Add member (head only)           |
| GET    | `/api/payments`          | JWT  | Family payment history           |
| POST   | `/api/payments/create`   | JWT  | Create current-year payment      |
| POST   | `/api/payments/webhook`  | HMAC | Gateway outcome (verified)       |

## Security notes

- All SQL is parameterized (`pg`); never interpolate user input into queries.
- OTPs are stored SHA-256 hashed, expire, and are limited by attempts/resends/rate limits.
  The code is never stored or returned in responses. `OTP_PROVIDER=console` prints codes
  to the server console **in development only** — never in production.
- Sessions are JWTs signed with `JWT_SECRET`; identity, family, and head status are
  resolved server-side, never trusted from the client.
- Payment success is only accepted through the HMAC-verified webhook.
- Centralized error handling never leaks SQL, stack traces, or internals.
- Graceful shutdown on SIGTERM/SIGINT closes the HTTP server and the pg pool.