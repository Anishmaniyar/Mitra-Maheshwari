import dotenv from 'dotenv';
import { z } from 'zod';
import {
  assertOriginsForEnv,
  parseAllowedOrigins,
} from '../middleware/cors.js';

dotenv.config();

const envSchema = z.object({
  // Required with NO default: a deployed application must never silently
  // fall back to development mode (dev admin login, OTP console logging,
  // insecure cookies, and verbose errors all key off this).
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be numeric')
    .default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Base secret: signs access JWTs. Also the fallback HMAC key for OTP and
  // refresh-token hashing when the dedicated secrets below are unset.
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  // Optional dedicated secrets. When set they replace JWT_SECRET for that
  // single use (existing deployments keep working without rotation; setting
  // one later invalidates outstanding challenges/sessions by design).
  OTP_HASH_SECRET: z.string().min(1).optional(),
  REFRESH_TOKEN_SECRET: z.string().min(1).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  MEMBERSHIP_ANNUAL_FEE_AMOUNT: z.string().default('1100'),
  MEMBERSHIP_CURRENCY: z.string().default('INR'),
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
  // Explicit browser allowlist (comma-separated exact origins). Empty means
  // same-origin / non-browser use only; production requires ≥1 https origin.
  CORS_ALLOWED_ORIGINS: z.string().default(''),
  JSON_BODY_LIMIT: z
    .string()
    .regex(/^\d+(b|kb|mb)?$/i, 'JSON_BODY_LIMIT must look like 100kb')
    .default('100kb'),
  PG_POOL_MAX: z.coerce.number().int().positive().default(20),
  PG_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  PG_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  // Redis is required infrastructure (OTP challenges + rate-limit counters).
  // The API fails closed with 503 when Redis is unreachable: there is no
  // in-memory or PostgreSQL fallback, by design.
  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),
  REDIS_TLS: z.enum(['true', 'false']).default('false'),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  // Trust proxy for req.ip / rate-limit keys. 'false' (default), 'true', or a
  // hop count ('1'). Only set a truthy value when the hosting proxy is
  // explicitly trusted, otherwise X-Forwarded-For is ignored.
  TRUST_PROXY: z.string().default('false'),
  // OTP challenge policy. Defaults: 6-digit code, 5-minute expiry, 5 failed
  // attempts per challenge, 60-second resend cooldown, 5 resends per hour
  // per mobile+purpose, 15-minute single-use verification-proof window.
  OTP_EXPIRY_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  OTP_MAX_RESENDS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_WINDOW_SECONDS: z.coerce.number().int().positive().default(3600),
  OTP_PROOF_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  // Distributed rate limits (max requests per windowMs window). Each pair is
  // independently configurable; see middleware/rateLimit.ts for keying.
  RL_OTP_REQUEST_IP_MAX: z.coerce.number().int().positive().default(30),
  RL_OTP_REQUEST_IP_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RL_OTP_REQUEST_MOBILE_MAX: z.coerce.number().int().positive().default(5),
  RL_OTP_REQUEST_MOBILE_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RL_OTP_VERIFY_IP_MAX: z.coerce.number().int().positive().default(60),
  RL_OTP_VERIFY_IP_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RL_OTP_VERIFY_MOBILE_MAX: z.coerce.number().int().positive().default(10),
  RL_OTP_VERIFY_MOBILE_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RL_REFRESH_IP_MAX: z.coerce.number().int().positive().default(60),
  RL_REFRESH_IP_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RL_REGISTRATION_COMPLETE_IP_MAX: z.coerce.number().int().positive().default(10),
  RL_REGISTRATION_COMPLETE_IP_WINDOW_MS: z.coerce.number().int().positive().default(3600000),
  RL_INVITATION_CREATE_USER_MAX: z.coerce.number().int().positive().default(20),
  RL_INVITATION_CREATE_USER_WINDOW_MS: z.coerce.number().int().positive().default(3600000),
  RL_INVITATION_ACCEPT_IP_MAX: z.coerce.number().int().positive().default(20),
  RL_INVITATION_ACCEPT_IP_WINDOW_MS: z.coerce.number().int().positive().default(3600000),
  RL_PAYMENT_ORDER_USER_MAX: z.coerce.number().int().positive().default(10),
  RL_PAYMENT_ORDER_USER_WINDOW_MS: z.coerce.number().int().positive().default(3600000),
  RL_CANDIDATES_IP_MAX: z.coerce.number().int().positive().default(60),
  RL_CANDIDATES_IP_WINDOW_MS: z.coerce.number().int().positive().default(900000),
});

export type Env = z.infer<typeof envSchema>;

const MIN_PROD_SECRET_LENGTH = 32;

const isPlaceholderSecret = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }
  return (
    normalized.includes('change-me') ||
    normalized.includes('changeme') ||
    normalized.includes('example') ||
    normalized.includes('placeholder') ||
    normalized.includes('your-secret') ||
    ['secret', 'password', 'test', 'testing', 'development', '123456'].includes(
      normalized,
    )
  );
};

const assertStrongSecret = (name: string, value: string): void => {
  // Messages name the variable only: values are never echoed into errors.
  if (isPlaceholderSecret(value)) {
    throw new Error(`${name} must not be empty or a placeholder value`);
  }
  if (value.trim().length < MIN_PROD_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_PROD_SECRET_LENGTH} characters`);
  }
};

const DURATION_RE = /^(\d+)(ms|s|m|h|d)$/;

// Startup gate for production: missing/weak configuration fails the boot
// loudly instead of serving traffic in a degraded or insecure mode.
export const validateProductionConfig = (
  parsed: Env,
  raw: Record<string, string | undefined>,
): void => {
  if (parsed.NODE_ENV !== 'production') {
    return;
  }
  assertStrongSecret('JWT_SECRET', parsed.JWT_SECRET);
  if (parsed.OTP_HASH_SECRET !== undefined) {
    assertStrongSecret('OTP_HASH_SECRET', parsed.OTP_HASH_SECRET);
  }
  if (parsed.REFRESH_TOKEN_SECRET !== undefined) {
    assertStrongSecret('REFRESH_TOKEN_SECRET', parsed.REFRESH_TOKEN_SECRET);
  }
  const origins = parseAllowedOrigins(parsed.CORS_ALLOWED_ORIGINS);
  if (origins.length === 0) {
    throw new Error(
      'CORS_ALLOWED_ORIGINS must list at least one frontend origin in production',
    );
  }
  assertOriginsForEnv(origins, 'production');
  for (const [name, value] of [
    ['ACCESS_TOKEN_EXPIRES_IN', parsed.ACCESS_TOKEN_EXPIRES_IN],
    ['REFRESH_TOKEN_EXPIRES_IN', parsed.REFRESH_TOKEN_EXPIRES_IN],
  ] as const) {
    if (!DURATION_RE.test(value.trim())) {
      throw new Error(`${name} must look like 15m, 30d, or 5000ms`);
    }
  }
  if (
    !parsed.RAZORPAY_KEY_ID ||
    !parsed.RAZORPAY_KEY_SECRET ||
    !parsed.RAZORPAY_WEBHOOK_SECRET
  ) {
    throw new Error(
      'RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET are required in production',
    );
  }
  if (!raw.REDIS_URL) {
    throw new Error('REDIS_URL must be set explicitly in production');
  }
};

// Testable entry point: parse a raw environment mapping, then run the
// production gate. The module singleton below applies it to process.env.
export const loadEnv = (raw: Record<string, string | undefined>): Env => {
  const parsed = envSchema.parse(raw);
  validateProductionConfig(parsed, raw);
  return parsed;
};

export const env: Env = loadEnv(process.env);
