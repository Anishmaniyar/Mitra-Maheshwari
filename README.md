# Mitra Maheshwari Seva Pratishthan — Community PWA

A mobile-first community platform: existing member verification, family onboarding,
OTP authentication, a family dashboard, family member management, and membership payments.

```
frontend/   React + TypeScript + Vite + React Router + PWA (custom CSS design system)
backend/    Node.js + Express + TypeScript + PostgreSQL (pg driver, SQL migrations)
```

The backend connects to a **PostgreSQL installation on your machine** — no Docker, no ORM.

## Quick start

Prerequisites: Node 20+, PostgreSQL installed and running locally.

```bash
# 1. Create the database (from psql)
CREATE DATABASE mitra_maheshwari;

# 2. Backend (see backend/README.md for details)
cd backend
npm install
cp .env.example .env        # set DATABASE_URL + JWT_SECRET + ADMIN_ACCESS_SECRET
npm run db:migrate
npm run dev                 # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

OTP codes are printed to the **backend console** outside production (the console
delivery adapter), so the flow works without an SMS provider.

## Structure

```
frontend/
├── public/cropped-logo-removebg-preview.webp   # organization logo
├── public/icons/                               # PWA icons (generated)
└── src/
    ├── styles/global.css                       # THE design system (tokens + base + utilities)
    ├── components/
    │   ├── common/    forms/    layout/        # Logo, Button, FormField, OtpInput, Header, ...
    ├── features/      registration/ authentication/ family/ payment/   (+ *.service.ts)
    ├── pages/         Landing, VerifyMember, MemberDetails, OtpVerification, Dashboard, Family, Payments
    └── routes/  services/api.ts  hooks/  types/  utils/  App.tsx  main.tsx

backend/
├── database/migrations/    # numbered TypeScript migrations
└── src/
    ├── config/    middleware/    utils/    shared/
    ├── modules/   auth/  registration/  family/  payment/  admin/  stats/
    │               (routes → validation → controller → service → repository)
    ├── app.ts     server.ts
```

## Environment variables

Frontend (`frontend/.env.example`): `VITE_API_BASE_URL` (defaults to `/api` — the Vite
dev proxy forwards to the backend).

Backend (`backend/.env.example`): `DATABASE_URL`, `PORT` (5000), `NODE_ENV`,
`JWT_SECRET` (plus optional `OTP_HASH_SECRET` / `REFRESH_TOKEN_SECRET`),
`ADMIN_ACCESS_SECRET` / `ADMIN_SESSION_EXPIRES_IN` for the shared admin link,
token lifetimes, `REDIS_URL`, `CORS_ALLOWED_ORIGINS`, Razorpay keys, and the
`OTP_*` / `RL_*` policy vars. Production startup refuses weak or placeholder
secrets.

The admin panel opens from a private link: `<frontend-origin>/admin#<secret>`
where `<secret>` equals `ADMIN_ACCESS_SECRET`. The fragment is exchanged for an
HttpOnly admin cookie and stripped from the URL. Rotate the secret to revoke all
admin sessions. No admin account or password exists.

**Credentials are never committed.** `docker-compose.yml` requires
`POSTGRES_PASSWORD` from your environment (repo-root `.env`, gitignored) or the
shell; generate one with `openssl rand -hex 24`. If a database password was ever
committed, rotate it: `ALTER USER postgres WITH PASSWORD '<new>';`.

## API endpoints

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/health` | — | Readiness (200 ready / 503 database down) |
| GET | `/api/stats` | — | Public community counters |
| POST | `/api/auth/request-otp` | — | Send OTP (LOGIN / REGISTRATION / INVITATION) |
| POST | `/api/auth/verify-otp` | — | Verify OTP → explicit nextAction (+ tokens only for LOGGED_IN) |
| POST | `/api/auth/refresh` | cookie | Rotate refresh token → new access token |
| POST | `/api/auth/logout` | cookie | Revoke refresh token |
| GET | `/api/auth/me` | JWT | Current member profile |
| GET | `/api/registration/candidates` | — | Name-only candidate lookup |
| POST | `/api/registration/complete` | OTP proof | Create family + head (PENDING) |
| GET | `/api/family` | JWT | Family, members, invitations, membership |
| GET/PATCH/DELETE | `/api/family/members/:memberId` | JWT | Read / update / remove a member |
| GET/POST | `/api/family/invitations` | JWT (head) | List / create invitations |
| DELETE | `/api/family/invitations/:id` | JWT (head) | Cancel a pending invitation |
| GET | `/api/family/invitations/:token` | — | Validate an invite link |
| POST | `/api/family/invitations/:token/accept` | OTP proof | Accept an invitation |
| GET | `/api/payments` | JWT | Payment history |
| POST | `/api/payments/order` | JWT (head) | Create/reuse the current-year order |
| POST | `/api/payments/verify` | JWT | Verify Razorpay signature |
| POST | `/api/payments/webhook/razorpay` | HMAC | Gateway outcome (raw-body verified) |
| POST | `/api/admin/session` | link secret | Exchange the shared admin link for a session cookie |
| GET | `/api/admin/session` | admin cookie | Validate the current admin session |
| POST | `/api/admin/session/logout` | admin cookie | Clear the admin session |
| GET | `/api/admin/registrations` | admin cookie | Pending queue (paginated) |
| GET | `/api/admin/registrations/:id` | admin cookie | Pending registration detail |
| POST | `/api/admin/registrations/:id/approve` \| `/reject` | admin cookie + CSRF header | Registration decisions |

## Logo

The real logo ships at `frontend/public/cropped-logo-removebg-preview.webp` and is
rendered by the `Logo` component (falls back to a monogram if missing).

## Notes

- PostgreSQL via the `pg` driver; SQL migrations in `backend/database/migrations`
  applied by `npm run migrate` (tracked in `schema_migrations`).
- OTPs are stored SHA-256 hashed with expiry, attempt and resend limits; sessions are
  JWTs. No passwords.
- Payment success is only accepted through the HMAC-signed webhook; one payment per
  family per year.
- PWA: manifest + service worker via `vite-plugin-pwa` (installable, basic caching).