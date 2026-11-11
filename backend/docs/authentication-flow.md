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
- **Challenge state lives in Redis only.** PostgreSQL has no OTP table; there is no
  in-memory or database fallback (Redis unavailable → 503, fail closed).

## 1. Request OTP flow

```
POST /api/auth/request-otp  { mobile, purpose? }
  → validateRequest (Zod: mobile format, purpose ∈ LOGIN | REGISTRATION | INVITATION)
  → purpose defaults to LOGIN
  → Redis, atomically:
      SET otp:cd:{purpose}:{mobHash} NX EX OTP_RESEND_COOLDOWN_SECONDS   (cooldown)
      INCR otp:rs:{purpose}:{mobHash} (+ TTL window)                     (resend cap)
      HSET otp:ch:{purpose}:{mobHash} { h: hash(code), a: 0, c: 0, p: purpose } EX expiry
      SET  otp:cur:{mobHash} purpose EX expiry                            (latest purpose)
  → delivery adapter (console outside production): code is logged, never returned
  → 200 { message, status: 'success', data: { expiresAt } } — never echo the OTP
```

Key layout and policy live in `src/modules/auth/otpChallenge.store.ts`; the mobile
number is SHA-256 hashed into key names (no PII/hashed codes as plain keys). Policy
(expiry, attempts, cooldown, resend cap, proof TTL) is configured through
`OTP_*` environment variables.

## 2. Verify OTP flow

Verification proves control of a mobile number. It does NOT implicitly log in:
the response always carries an explicit `accountStatus` + `nextAction`, and
tokens are present only when `nextAction` is `LOGGED_IN`.

```
POST /api/auth/verify-otp  { mobile, code, purpose? }
  → validateRequest (Zod)
  → Redis Lua script (single round trip, atomic):
      missing/expired challenge            → 401 (generic message)
      already consumed / attempts exhausted → 401
      purpose mismatch (explicit purpose)   → 401, no state changed
      wrong code                            → HINCRBY attempts, 401
      correct code                          → mark consumed, DEL challenge,
                                              SET otp:proof:{purpose}:{mobHash} EX ttl
  → resolve identity: accounts.mobile → member
      no account        → 200 { verified: true, accountStatus: 'NONE',
                                nextAction: 'COMPLETE_REGISTRATION' } (no tokens)
      status PENDING    → 200 { accountStatus: 'PENDING', nextAction: 'AWAITING_APPROVAL' }
      status REJECTED   → 200 { accountStatus: 'REJECTED', nextAction: 'CONTACT_SUPPORT' }
      APPROVED + LOGIN  → issue access + refresh tokens (§3, §4) and
                          200 { accountStatus: 'APPROVED', nextAction: 'LOGGED_IN',
                                accessToken, member }
      APPROVED + other purpose → 200 { nextAction: 'CONTACT_SUPPORT' } (no tokens)
```

## 2b. Registration / invitation proof (single-use, flow-bound)

Registration (`POST /api/registration/complete`) and invitation acceptance
(`POST /api/family/invitations/:token/accept`) never trust the frontend. Each
atomically claims the Redis proof for its own purpose
(`claimVerificationProof(mobile, purpose)`), which is a single `GET` + `DEL`
Lua script:

- The proof exists only after a successful verify for that exact purpose.
- A `LOGIN` proof can never register or accept an invitation, and one proof
  completes exactly one flow.
- Expiry is `OTP_PROOF_TTL_SECONDS` (default 15 minutes). If the proof has
  expired, the API returns 401 and the user must verify the mobile again.
- The proof is claimed **before** the duplicate-mobile/account checks, so a
  409 consumes it by design (the caller must re-verify).

## 3. Access token flow

- Short-lived JWT (`ACCESS_TOKEN_EXPIRES_IN`, default 15 minutes), sent in the
  response body and held **in memory** by the frontend.
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
`HttpOnly` (+ `Secure`/`SameSite=Lax` in production) cookie — never in JS-readable
storage. Because the access token is memory-only, the app calls `/auth/refresh`
on load to restore a session; a failed refresh clears local auth state.

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
