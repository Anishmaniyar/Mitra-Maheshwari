# Redis — OTP challenges + distributed rate limiting

One shared Redis deployment backs two concerns. Key prefixes keep them
logically separate (`otp:` vs `rl:`). There is no in-memory or PostgreSQL
fallback: when Redis is unreachable the API fails closed with
`503 Service temporarily unavailable`.

## Connection configuration

| Variable | Default | Meaning |
|---|---|---|
| `REDIS_URL` | `redis://127.0.0.1:6379` | Connection URL (may embed credentials) |
| `REDIS_TLS` | `false` | `true` forces TLS even for `redis://` URLs |
| `REDIS_CONNECT_TIMEOUT_MS` | `5000` | TCP/TLS connect timeout |
| `TRUST_PROXY` | `false` | `false` / `true` / hop count (`1`). Only truthy behind an explicitly trusted proxy/LB, otherwise `X-Forwarded-For` is ignored and rate-limit IP keys use the direct peer |

A `rediss://` URL always enables TLS. Credentials live only in `REDIS_URL`
(environment/secret manager, never logs: connection errors are redacted and
command failures map to a constant 503 message).

## Running Redis locally

Development: `redis-server` locally, or `docker run -p 6379:6379 redis:7`,
with the default `REDIS_URL`. Tests need nothing manual: each test process
starts an ephemeral `redis-memory-server` instance (binary cached after the
first download) and never touches development or production Redis.

## Production requirements

- Provision one Redis reachable from **all** API instances (shared counters
  and OTP state are the point: per-process memory would split limits and
  strand challenges).
- Restrict network access to the API security group/VPC; use a strong
  password and TLS (`rediss://` or `REDIS_TLS=true`).
- Set `TRUST_PROXY` to match the load balancer (usually `1`); leaving it
  `false` behind a proxy keys every client to the proxy IP.
- Monitor memory, evictions, and latency; size for peak OTP + limiter
  writes. No persistence is required (all keys are TTL windows), but
  replicas/failover are recommended for availability.
- Deploy note: because failure is closed, a Redis outage returns 503 for
  OTP and rate-limited routes instead of degraded service. Alert on 503
  rate; recover Redis rather than bypassing.

## OTP challenge keys (`otp:`)

Mobiles are SHA-256 hashed in every key name (no PII, OTPs, or tokens in
keys). `{purpose}` is one of `LOGIN | REGISTRATION | INVITATION`.

| Key | Type | TTL (default) | Purpose |
|---|---|---|---|
| `otp:ch:v1:{purpose}:{mobHash}` | Hash `{h,a,c,p}` | `OTP_EXPIRY_SECONDS` (300) | Challenge: keyed OTP hash, failed attempts, consumed flag, bound purpose |
| `otp:cur:v1:{mobHash}` | String (purpose) | `OTP_EXPIRY_SECONDS` (300) | Latest-wins pointer: unqualified verify consumes the newest challenge |
| `otp:cd:v1:{purpose}:{mobHash}` | String flag (`SET NX`) | `OTP_RESEND_COOLDOWN_SECONDS` (60) | Atomic resend cooldown |
| `otp:rs:v1:{purpose}:{mobHash}` | Counter (`INCR`) | `OTP_RESEND_WINDOW_SECONDS` (3600) | Per-mobile resend cap (`OTP_MAX_RESENDS`, 5) |
| `otp:proof:v1:{purpose}:{mobHash}` | String nonce | `OTP_PROOF_TTL_SECONDS` (900) | Single-use verification proof, claimed atomically (`GET`+`DEL` Lua) |

Verification + consumption + proof issuance is one Lua script: missing /
consumed / exhausted / wrong-code (attempt counted via `HINCRBY`) /
purpose-mismatch (no state change) all return the same generic 401, while
exactly one concurrent correct guess consumes the challenge.

## Rate-limit keys (`rl:`) and policies

`express-rate-limit` + `rate-limit-redis` (fixed windows, Lua-backed
increment). Limits are `MAX` requests per `WINDOW_MS`; exceeding returns
`429 { status: 'error', message }` plus a `Retry-After` (seconds) header and
standard `RateLimit-*` headers.

| Limiter | Key | Default |
|---|---|---|
| OTP request IP | client IP | 30 / 15 min |
| OTP request mobile | `sha256(mobile)` | 5 / 15 min |
| OTP verify IP | client IP | 60 / 15 min |
| OTP verify mobile | `sha256(mobile)` | 10 / 15 min |
| Session refresh IP | client IP | 60 / 15 min |
| Registration complete IP | client IP | 10 / hour |
| Invitation create user | authenticated `memberId` | 20 / hour |
| Invitation accept IP | client IP | 20 / hour |
| Payment order user | authenticated `memberId` | 10 / hour |
| Candidate search IP | client IP | 60 / 15 min |

Every default is overridable via `RL_*` variables (see `.env.example`).
`POST /api/payments/webhook/razorpay` is deliberately unlimited (provider
retries are guarded by signature verification + idempotent transitions).

## OTP flow vs delivery (SMS later)

Generation, hashing, storage, expiry, attempts, consumption, and proofs
live in `src/modules/auth/otpChallenge.store.ts` and never import delivery
code. Delivery is the `OtpDelivery` interface
(`src/shared/auth/otpDelivery.ts`); today `consoleOtpDelivery` logs the code
outside production only. Adding an SMS vendor = new `OtpDelivery`
implementation wired in `auth.service.requestOtp` — verification, proofs,
and rate limits stay untouched.

## Verification proofs (registration / invitation)

A successful verify atomically mints a purpose-bound proof
(`otp:proof:…`, 15 min TTL). `completeRegistration` claims the
`REGISTRATION` proof; invitation acceptance claims the `INVITATION` proof.
Claims are atomic single-use: a `LOGIN` proof can never register/invite,
and one proof completes exactly one flow. The legacy `otps` table and its
migrations are retained untouched for history; new challenges do not use
them (removal requires a reviewed migration).
