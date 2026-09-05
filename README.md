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
cp .env.example .env        # set DATABASE_URL to your local PostgreSQL
npm run migrate
npm run seed                # fake dev data; demo head: Rajesh Mehta, 9876543210
npm run dev                 # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

OTP codes are printed to the **backend console** in development
(`OTP_PROVIDER=console`) so the flow works without an SMS provider.

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
├── database/
│   ├── migrations/    # numbered SQL migrations (001..005)
│   └── seed/development.sql
└── src/
    ├── config/    middleware/    utils/    types/
    ├── modules/   members/  auth/  family/  payment/     (routes → validation → controller → service → repository)
    ├── scripts/   migrate.ts  seed.ts
    ├── app.ts     server.ts
```

## Environment variables

Frontend (`frontend/.env.example`): `VITE_API_BASE_URL` (defaults to `/api` — the Vite
dev proxy forwards to the backend).

Backend (`backend/.env.example`): `DATABASE_URL`, `PORT` (5000), `NODE_ENV`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `OTP_PROVIDER` + OTP policy vars,
`MEMBERSHIP_FEE`, `CURRENCY`, `WEBHOOK_SECRET`.

## API endpoints

| Method | Path                     | Auth | Purpose                       |
| ------ | ------------------------ | ---- | ----------------------------- |
| GET    | `/health`                | —    | Health + DB readiness         |
| POST   | `/api/members/match`     | —    | Match visitor (EXISTING / NO_MEMBER / MULTIPLE_MATCHES) |
| POST   | `/api/members`           | —    | New registration (family + head atomically) |
| GET    | `/api/me` / PATCH `/api/me` | JWT | Profile                    |
| POST   | `/api/auth/send-otp` / `resend-otp` / `verify-otp` | — | OTP → JWT |
| GET    | `/api/family`            | JWT  | Family + members + membership |
| POST   | `/api/family/members`    | JWT  | Add member (head only)        |
| GET    | `/api/payments`          | JWT  | Payment history               |
| POST   | `/api/payments/create`   | JWT  | Create current-year payment   |
| POST   | `/api/payments/webhook`  | HMAC | Gateway outcome (verified)    |

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