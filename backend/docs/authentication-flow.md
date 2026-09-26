# Member Login Flow (Mobile + OTP, No Password)

Authoritative flow doc for the auth implementation. No passwords exist in this system:
**a verified OTP is the sole authentication proof.**

## Non-negotiable rules

- **OTP verification = authentication proof.** Nothing else grants tokens.
- **Name matching is NEVER authentication.** First/middle/last name may only be used
  for candidate matching during registration. A name match proves nothing about identity.
- **Member lookup uses mobile first** (`accounts.mobile`, unique, one row per member).
- **JWTs carry no sensitive profile data.** Allowed claims only (see §3).
- **Authorization is always enforced on the backend**, never delegated to the frontend.

## 1. Request OTP flow

```
POST /api/auth/request-otp  { mobile }
  → validateRequest (Zod: mobile format)
  → find latest unconsumed otps row for mobile
  → rate-limit: reject if resend_count exceeded or last_sent_at too recent (429)
  → generate 6-digit OTP
  → hash OTP (never store the plain code; column: otps.code_hash)
  → INSERT otps (member_id = lookup by mobile, NULLABLE if no member yet;
                 expires_at = now + short window; attempts = 0)
  → demo delivery: log OTP as 123456 (dev only — never in production)
  → 200 { message, status: 'success', data: { expiresAt } } — never echo the OTP
```

Table used: `otps` (`mobile`, `code_hash`, `expires_at`, `attempts`, `max_attempts`,
`resend_count`, `last_sent_at`, `consumed_at`).

## 2. Verify OTP flow

```
POST /api/auth/verify-otp  { mobile, code }
  → validateRequest (Zod)
  → SELECT latest otps row for mobile WHERE consumed_at IS NULL
  → if none → 401 (generic message; do not reveal whether the mobile exists)
  → if now > expires_at → 401
  → if attempts >= max_attempts → 401 (OTP burned; request a new one)
  → timing-safe compare hash(code) vs code_hash
      → mismatch: attempts = attempts + 1 → 401
      → match: SET consumed_at = now() (single-use; consumed OTPs never verify again)
  → resolve member: accounts.mobile → member_id → members row
      → no member yet → hand off to registration (registration_sessions;
         otp_verified_at = now()). No tokens issued until a member exists.
      → member.status ≠ APPROVED → 403 (PENDING/REJECTED members get no tokens)
  → issue tokens (§3, §4)
```

Order matters: expiry and attempt checks run **before** hash comparison so a dead OTP
can never authenticate, and every failed comparison increments `attempts`.

## 3. Access token flow

- Short-lived JWT (minutes, not days), sent in the response body.
- Claims — **only** these:
  `sub` (member id), `role` (ADMIN | MEMBER), `familyId`, `isFamilyHead`, `iat`, `exp`, `jti`.
- **Never inside JWT:** name, mobile, blood group, PAN, address, occupation,
  or any other profile field. Profile data is fetched from PostgreSQL per request.
- Signed with `JWT_SECRET`; verified on every protected request by `authenticate()`.

## 4. Refresh token flow

```
POST /api/auth/refresh  (HttpOnly cookie carries the refresh token)
  → hash presented token → SELECT refresh_tokens by token_hash
  → reject if missing, expired, or revoked_at IS NOT NULL
  → rotation: INSERT new row, SET old.replaced_by_token_id = new.id,
              SET old.revoked_at = now()
  → reuse detection: presenting an already-rotated (revoked with a successor)
    token revokes the whole chain (possible theft) → 401, clear cookie
  → issue new access JWT (§3) + new refresh token in HttpOnly cookie
```

Table used: `refresh_tokens` (`member_id`, `token_hash`, `expires_at`,
`revoked_at`, `replaced_by_token_id` self-FK forming the rotation chain).
Properties: long-lived, single-use via rotation, transported only via
`HttpOnly` (+ `Secure`/`SameSite` in production) cookie — never in JS-readable storage.

## 5. Logout flow

```
POST /api/auth/logout  (authenticated or with refresh cookie)
  → SET refresh_tokens.revoked_at = now() for the presented token
  → clear the HttpOnly cookie
  → 200 success
```

The access JWT is **not** revoked server-side — it simply expires quickly by design
(`exp` + `jti` claim available if a denylist is ever required later; none exists now).

## 6. Authentication middleware (`authenticate()`)

```
HTTP request
  → read access token (Authorization: Bearer <jwt>)
  → verify JWT signature + exp
  → attach req.user = { id: sub, role, familyId, isFamilyHead }
  → next()
```

Responsibility ends there: identity only, no permission decisions.
Missing/invalid/expired token → `AppError(..., 401)`.

## 7. Authorization middleware (`authorize()`)

- Role gate only: `authorize('ADMIN')` / `authorize('MEMBER')` checks
  `req.user.role`. Wrong role → `AppError(..., 403)`.
- **Family ownership checks live in the service layer**, not in middleware.
  Example rule: a Family Head may manage members only if
  `requester.isFamilyHead === true AND targetMember.familyId === requester.familyId`.
- Middleware order on routes: `authenticate → authorize → validateRequest → controller`
  (public routes: `validateRequest → controller`).
