# Production deployment — configuration and assumptions

## Required environment (hosting dashboard / secret manager)

`NODE_ENV=production` (explicit; the app refuses to boot without it),
`DATABASE_URL`, `JWT_SECRET` (≥ 32 chars, not a placeholder),
`CORS_ALLOWED_ORIGINS` (≥ 1 `https://` origin, comma-separated),
`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`,
`REDIS_URL` (explicit; managed Redis, `rediss://` or `REDIS_TLS=true`).
Optional dedicated HMAC keys: `OTP_HASH_SECRET`, `REFRESH_TOKEN_SECRET`
(unset = fall back to `JWT_SECRET`; setting one later invalidates
outstanding challenges/sessions once, by design). Missing or weak
production configuration fails startup loudly — it never serves traffic
degraded. See `.env.example` for the full list with defaults.

## Hosting assumptions

- TLS terminates at the proxy/LB; internal traffic may be plain http.
  Helmet sends HSTS/CSP/frameguard/nosniff headers end-to-end (CoRP is
  disabled because the approved browser frontend reads this API
  cross-origin).
- Set `TRUST_PROXY` to the actual proxy hop count (usually `1`) so
  `req.ip`-based rate-limit keys are correct. Never enable it without a
  trusted proxy — forwarded headers from arbitrary clients would then be
  trusted. Default `false` = direct connections only.
- Run `npm run db:migrate` before `npm start` on each deploy; keep one
  writer during migrations.
- One shared Redis for all API instances (OTP + rate limits); Postgres
  with backups + point-in-time recovery (nothing in source covers these).

## Cookie and CSRF posture

Refresh cookie: `HttpOnly`, `Secure` (production), `SameSite=Lax`,
`Path=/`, unchanged name/lifetime. No separate CSRF token, deliberately:
the cookie is withheld on cross-site POSTs by `SameSite=Lax`, and the
access token that authorizes API calls travels in the `Authorization`
header (never a cookie), so forged cross-site requests arrive
unauthenticated either way. Do not relax `SameSite` below `Lax` without
adding token-based CSRF protection and a frontend contract change.

## Shutdown and crash behavior

`SIGTERM`/`SIGINT` drain in-flight requests up to `SHUTDOWN_TIMEOUT_MS`
(default 10 s), then close Redis + the PG pool (repeat signals exit
immediately; cleanup runs once). Uncaught exceptions / unhandled
rejections log and exit non-zero for the orchestrator to restart — the
process never limps on in an unknown state.

## Dev-only surfaces (blocked in production)

`POST /api/auth/dev-admin-login` is not mounted when
`NODE_ENV=production` (and its service throws 403 regardless), and OTP
console logging is compiled out by the same gate. There is no public admin
signup; provision admins with `npm run admin:seed -- <mobile>`.
