# Mitra Maheshwari — v1 Notes

> Community PWA for "Mitra Maheshwari Seva Pratishthan". Mobile-first. Members verify
> themselves, register a family, get approved by an admin, then use a family
> dashboard (members, invitations, membership payments).

---

## 1. What it is

- **Frontend:** React + TypeScript + Vite PWA (`frontend/`), custom CSS design system.
- **Backend:** Node.js + Express + TypeScript (`backend/`), `pg` driver, SQL migrations, no ORM.
- **Database:** PostgreSQL (Docker `mitra-postgres` on `localhost:5433` after the recent switch; native Postgres on `5432` is still there as a rollback copy).
- **Cache / OTP state:** Redis (`mitra-redis`, `localhost:6379`).
- **Auth:** JWT access token in memory + HttpOnly refresh cookie. OTP-based login, no passwords.
- **Payments:** Razorpay (orders + webhook), one successful payment per family per year.

---

## 2. Where data is stored

### PostgreSQL (`mitra_maheshwari`)

| Table | Purpose |
|---|---|
| `families` | A family unit: `family_code` (MM-YYYY-XXXXXX), status (`PENDING`/`ACTIVE`/`REJECTED`), `created_by_member_id`, `approved_by_member_id` |
| `members` | Person in a family: name, mobile, blood group, age, occupation, area, PAN, `is_head`, status |
| `accounts` | Login identity per member: `mobile`, `role` (`MEMBER`/`ADMIN`, legacy — admin-panel access is shared-link based), `last_login_at` |
| `refresh_tokens` | Hashed refresh tokens with rotation + revocation chain |
| `registration_sessions` | In-progress registration state (created by migrations) |
| `family_invitations` | Invite a person to join a family: `invitee_name`, `invitee_mobile`, `token`, status, expiry |
| `payments` | One row per checkout attempt: `family_id`, `year`, amount, provider ids, `status` (`ORDER_CREATED`/`AUTHORIZED`/`CAPTURED`/`FAILED`), receipt |
| `pgmigrations` | Tracks applied migrations (13 in v1) |

Indexes worth knowing:
- `payments_one_success_per_family_year` — at most one `CAPTURED`/`AUTHORIZED` per family+year.
- `payments_one_open_per_family_year` — at most one open (`PENDING`/`ORDER_CREATED`) attempt per family+year.
- `family_invitations_one_pending_per_mobile` — at most one `PENDING` invite per family+mobile.
- `otps` table was **dropped** — OTP state lives only in Redis.

### Redis
- OTP challenges (hashed code, expiry, attempt counter, resend caps, cooldown).
- Single-use verification **proofs** (REGISTRATION / INVITATION / LOGIN-bound).
- Rate-limit counters.

### Frontend (browser only)
- `sessionStorage` key `mm_registration_draft` — in-progress registration data (survives refresh).
- Access token: **in memory only** (not localStorage). Refresh cookie is HttpOnly.
- Nothing else is persisted client-side.

---

## 3. Domain entities

- **Family** = household. Status drives access: `PENDING` (awaiting admin approval), `ACTIVE` (members can log in), `REJECTED`.
- **Member** = person. Head of family has `is_head = true`. Member status tracks its own approval (`PENDING`/`APPROVED`/`REJECTED`).
- **Account** = login identity keyed by mobile. Role `MEMBER` or `ADMIN` (legacy — the admin panel is shared-link based). No passwords — OTP proves control of mobile.
- **Invitation** = link between a family and a new member. Accepted through the invitee's own OTP verification.
- **Payment** = annual family membership fee (one per family per year).
- **Registration proof** = short-lived Redis token issued after OTP verification, consumed exactly once by `/registration/complete` or `/family/invitations/:token/accept`.

---

## 4. User flow A — Join the community (new family)

Route: `/register` → `/register/details` → (optional) `/register/verify` → `/dashboard`.

1. **`/register` (VerifyMemberPage)** — enter first name, last name, mobile.
2. Backend candidate lookup (`GET /api/registration/candidates?firstName&lastName`) returns name-only matches (no mobiles exposed).
   - 0 matches → "No matching record found" → option to **Register as a new family**.
   - 1 match → "Is this your community record?" → pick it.
   - >1 matches → candidate picker.
3. **OTP on mobile** with purpose `REGISTRATION` (`POST /api/auth/request-otp`).
4. Verify OTP (`POST /api/auth/verify-otp`). Only outcome `COMPLETE_REGISTRATION` continues (no account yet).
5. **`/register/details` (MemberDetailsPage)** — review/correct profile (name, age, blood group, occupation, area, PAN). Mobile is fixed.
   - If the matched record exists: profile is pre-filled.
   - If new family: profile is seeded from entered details.
6. **Submit** → `POST /api/registration/complete` (mobile must carry a single-use `REGISTRATION` proof). Backend, in one transaction:
   - creates `families` (status `PENDING`, random `MM-YYYY-XXXXXX` code, retries on collision),
   - creates the head `members` (status `PENDING`, `is_head = true`),
   - creates `accounts` (role `MEMBER`).
7. Success screen: "registration submitted, pending admin approval". The user **cannot log in yet**.
8. If the 15-minute proof expired, the page shows a recovery link to re-verify.

Draft is kept in `sessionStorage` so a refresh mid-flow does not lose progress.

---

## 5. User flow B — Member login (existing approved member)

Route: `/login` → `/register/verify` → `/dashboard`.

1. **`/login` (MemberLoginPage)** — enter mobile only.
2. Draft saved with `flow: "login"`, navigate to `/register/verify`.
3. OTP sent with purpose `LOGIN`.
4. Verify OTP:
   - `LOGGED_IN` → access token in memory, refresh cookie set, redirect `/dashboard`.
   - `AWAITING_APPROVAL` → "your registration is awaiting admin approval".
   - `COMPLETE_REGISTRATION` → "not registered yet, join the community".
   - `CONTACT_SUPPORT` → "not approved, contact support".
5. On login, the sparse profile patch (`profileToPatch`) is pushed to `PATCH /api/family/members/:id` — **only filled fields**, and a failure there never blocks the session.

---

## 6. User flow C — Verify member (existing record match)

This is the "I'm already in the community directory" path inside `/register`:

- Name match → pick the record → draft saved with `memberId` + `flow: "join"` → `/register/details` (profile pre-filled from the matched member) → `/register/verify` (LOGIN-style OTP) → on verify, `completeRegistration` is **not** called; instead the existing record is the member. Actually for a matched record the flow continues through OTP verification and then the profile patch is applied; the family/account already exist.

Outcome rules (from `verifyOtp`):
- No account for that mobile → `COMPLETE_REGISTRATION` (new family).
- Account `PENDING` → `AWAITING_APPROVAL`.
- Account `APPROVED` + `LOGIN` purpose → `LOGGED_IN` (issues tokens).
- Otherwise → `CONTACT_SUPPORT`.

---

## 7. OTP system

- **Storage:** Redis only (hashed code, expiry, attempt cap, resend cooldown, per-mobile resend cap). No `otps` table.
- **Purposes:** `LOGIN`, `REGISTRATION`, `INVITATION`. The challenge's bound purpose is authoritative; a supplied purpose must match.
- **Proofs:** after successful verification, a single-use Redis proof is issued, bound to the mobile + purpose. Consumed exactly once by registration completion or invitation acceptance. A `LOGIN` proof can never mint a session or complete a registration.
- **Delivery:** console adapter in non-production (code printed to backend terminal); SMS provider later.
- **Rate limits:** layered — per-IP coarse shield + per-mobile tight caps, plus Redis-side resend cooldowns and attempt limits.
- **Endpoints:** `POST /api/auth/request-otp`, `POST /api/auth/verify-otp`.

---

## 8. Verification (admin approval) flow

A registration is `PENDING` until someone with the private admin link acts.

1. Open the shared link `<frontend-origin>/admin#<ADMIN_ACCESS_SECRET>`. The
   frontend reads the fragment, immediately removes it from the address bar, and
   exchanges the secret via `POST /api/admin/session` (body, never query string).
2. The backend validates `ADMIN_ACCESS_SECRET`, sets an HttpOnly,
   `SameSite=Strict`, admin-API-scoped cookie signed with a key derived from
   that secret, and returns the current pending queue. Rotating the secret
   invalidates all admin sessions; there are no admin accounts or passwords.
3. **`/admin` (AdminReviewPage)** — paginated queue (20/page, prev/next, total).
   Each row: family code, head name, mobile, created date.
4. Click a row → detail view: full family + all members (names, mobile, blood group, age, occupation, area, PAN).
5. Actions require the `X-Admin-CSRF: 1` header:
   - **Approve** → `POST /api/admin/registrations/:id/approve`: family + head member → `APPROVED`/`ACTIVE`, `approved_at` set, `approved_by_member_id` NULL.
   - **Reject** → `POST /api/admin/registrations/:id/reject`: family + member → `REJECTED`.
6. After approval the member can log in (OTP → `LOGGED_IN`).

Admin APIs are gated by `authenticateAdmin` (admin cookie + CSRF), completely
separate from member JWTs and from `authorize('ADMIN')`.

---

## 9. Family management (after login)

Route: `/family`. Head of family can manage; members can view.

- **View family:** `GET /api/family` returns family, members (with masked mobiles), invitations, and membership status for the current year.
- **Add member:** there is no direct member-creation endpoint. Adding a member means creating an **invitation** (`POST /api/family/invitations` with `inviteeName` + `inviteeMobile`). Backend enforces one pending invite per (family, mobile). Returns a token; frontend builds `/invite/:token`.
- **Cancel invitation:** `DELETE /api/family/invitations/:id` (head only, pending only).
- **Update member profile:** `PATCH /api/family/members/:memberId` (sparse patch — only provided fields).
- **Remove member:** `DELETE /api/family/members/:memberId`.

### Invitation acceptance flow (invitee)

Route: `/invite/:token`.

1. `GET /api/family/invitations/:token` validates the link (name, family code, status, expiry).
2. Invitee enters their details + OTP (purpose `INVITATION`).
3. `POST /api/family/invitations/:token/accept` consumes the single-use `INVITATION` proof and creates the member + account in the family (status `PENDING` until admin approves).
4. Duplicate pending invites for the same mobile are prevented (service-level idempotency + partial unique index).

---

## 10. Membership payments

Route: `/payments` (also surfaced on `/membership`).

- Annual fee per family, per calendar year.
- **Create order:** `POST /api/payments/order` — idempotent:
  - If a successful (`AUTHORIZED`/`CAPTURED`) payment exists for the year → rejected ("already paid").
  - If an open attempt exists and is < 30 min old → **reused** (same order).
  - If an open attempt is stale → marked `FAILED`, new order created.
  - Otherwise new order created.
  - Partial unique indexes enforce one open + one success per (family, year) at the DB level.
- **Checkout:** frontend loads Razorpay script, opens checkout with server-provided `keyId`, `orderId`, `amountPaise`.
- **Verify:** `POST /api/payments/verify` checks the HMAC signature. Success is ultimately accepted via the signed **webhook** `POST /api/payments/webhook/razorpay` (raw body, HMAC-verified).
- **Status mapping:** `AUTHORIZED` and `CAPTURED` both count as **paid** (capture is a provider-side follow-up). `FAILED` → failed. Open → pending.
- Payment history: `GET /api/payments`.

---

## 11. Auth architecture

- **Access token:** short-lived JWT, kept **in memory** in the frontend (`api.ts`). Sent as `Authorization: Bearer`.
- **Refresh token:** long-lived, stored hashed in `refresh_tokens`, delivered as an **HttpOnly cookie** (`refresh_token`). Rotated on every `/auth/refresh` (old one revoked + linked to new via `replaced_by_token_id`). Reuse of a revoked token revokes all active tokens for that member (theft detection).
- **Bootstrap:** on app load, `useAuth` calls `/auth/refresh` using the cookie to restore the session without a login.
- **Session expiry:** `api.ts` exposes `onSessionExpired()`; `useAuth` subscribes and clears state.
- **CSP:** injected at build time (`vite.config.ts`), strict policy (script-src self + Razorpay checkout; connect-src self + Razorpay; frame-src Razorpay). Dev mode keeps inline HMR preamble.
- **CORS:** exact-match allowlist from `CORS_ALLOWED_ORIGINS`, credentials enabled for the cookie flow.
- **Helmet + trust proxy:** security headers; `X-Forwarded-For` honored only if `TRUST_PROXY` is set.

---

## 12. Other features (portal)

- `/dashboard` — member home.
- `/family` — family & members.
- `/discover`, `/blood`, `/services`, `/matrimony` — community features.
- `/membership` — membership status.
- `/notifications` — notifications.
- `/profile` — profile view.
- `/settings` — settings.
- `/stats` (public) — community counters.

---

## 13. Backend module layout

Each module follows: `*.route.ts` → `*.controller.ts` → `*.service.ts` → `*.repository.ts`, with `*.schema.ts` (Zod) for validation and `*.mapper.ts` for typed row mapping.

Modules: `auth`, `registration`, `family`, `payment`, `admin`, `stats`.

Middleware: `authenticate`, `authorize`, `validate`, rate limiters, error handler, CORS.

Shared: JWT, OTP delivery, errors, types.

Config: `env` (validated, refuses weak secrets in production), `database` (pg pool), `redis`.

---

## 14. Dev setup & running

```bash
# Database (Docker)
docker compose --profile db up -d        # Postgres on :5433 + Redis on :6379

# Backend
cd backend
npm install
cp .env.example .env                    # set DATABASE_URL, JWT_SECRET, ADMIN_ACCESS_SECRET
npm run db:migrate                      # apply migrations
npm run dev                             # http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev                             # http://localhost:5173 (proxies /api + /health)
```

- OTP codes print to the **backend console** outside production.
- `/health` returns 200 when DB is up, 503 when down.
- Backend typecheck: `npm run typecheck` (or `tsc --noEmit`).
- Mapper tests: `node --import tsx --test src/modules/payment/payment.mapper.test.ts src/modules/family/family.mapper.test.ts`.

---

## 15. Things deliberately NOT in v1

- No passwords anywhere — OTP only.
- No demo/static data — all flows hit the real API.
- No `otps` table — Redis is authoritative.
- No direct member creation — members join via invitations.
- No duplicate payments — enforced by partial unique indexes + service idempotency.
- No client-side token storage — access token is in memory only.

---

## 16. Key files (quick reference)

- `frontend/src/routes/index.tsx` — route table.
- `frontend/src/services/api.ts` — central HTTP client, memory token, refresh bootstrap, session-expiry hook.
- `frontend/src/hooks/useAuth.tsx` — auth state, bootstrap via refresh cookie.
- `frontend/src/features/registration/draft.ts` — sessionStorage draft + sparse profile patch.
- `backend/src/app.ts` — Express app, helmet/CORS, health probe, raw-body webhook route.
- `backend/src/modules/auth/auth.service.ts` — OTP verify outcomes, token issuance, refresh rotation.
- `backend/src/modules/registration/registration.service.ts` — family + head creation in a transaction.
- `backend/src/modules/family/family.service.ts` — invitations (idempotent) + member management.
- `backend/src/modules/payment/payment.service.ts` — idempotent order creation + reconciliation.
- `backend/database/migrations/` — 13 migrations (incl. drop `otps`, partial unique indexes).

---

*Generated from the v1 codebase state (Nov 2026). Update this file when flows change.*