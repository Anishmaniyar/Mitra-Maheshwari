import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import {
  rateLimit,
  type ClientRateLimitInfo,
  type IncrementResponse,
  type Options as RateLimitOptions,
  type Store,
} from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { env } from '../config/env.js';
import { getRedis, toRedisUnavailableError } from '../config/redis.js';

// Distributed rate limiting over the shared Redis deployment (prefix `rl:`,
// logically separate from OTP challenge keys under `otp:`). Counters are
// shared across API instances via Redis TTL windows. When Redis is
// unreachable the store throws a safe 503 (fail closed): there is no
// in-memory fallback, so limits are never silently per-process.
//
// Keying never trusts caller-supplied keys: IP comes from req.ip (honors
// X-Forwarded-For only when TRUST_PROXY is explicitly enabled), mobiles are
// normalized + SHA-256 hashed (no PII in key names), and authenticated-user
// keys come from the verified JWT via req.user (limiters placed after
// `authenticate`). Razorpay webhooks intentionally have no limiter here:
// provider retries are protected by signature verification + idempotent
// processing instead.

const sha256Hex = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

const MOBILE_RE = /^\+?[0-9]{10,15}$/;

const readMobile = (req: Request): string | null => {
  const raw = (req.body as { mobile?: unknown } | undefined)?.mobile;
  if (typeof raw !== 'string') {
    return null;
  }
  const mobile = raw.trim();
  return MOBILE_RE.test(mobile) ? mobile : null;
};

const mobileKey = (req: Request): string => {
  const mobile = readMobile(req);
  // `skip` guarantees a valid mobile here; hash keeps PII out of Redis keys.
  return `mob:${sha256Hex(mobile ?? 'invalid')}`;
};

const skipWithoutMobile = (req: Request): boolean => readMobile(req) === null;

const userKey = (req: Request): string => `uid:${req.user?.memberId ?? 'anon'}`;
const skipWithoutUser = (req: Request): boolean => !req.user?.memberId;

// Custom key generators deliberately avoid req.ip, so the IPv6-subnet
// fallback check does not apply (keys are hashes/UUIDs, no IP material).
const noIpFallbackValidation = { keyGeneratorIpFallback: false } as const;

const makeStore = (prefix: string): Store => new LazyRedisStore(prefix);

class LazyRedisStore implements Store {
  // Keys live in shared Redis (never per-process), with the given prefix.
  readonly localKeys = false;
  readonly prefix: string;
  private readonly redisPrefix: string;
  private initOptions: RateLimitOptions | null = null;
  private readyPromise: Promise<RedisStore> | null = null;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.redisPrefix = `rl:${prefix}:`;
  }

  // express-rate-limit calls init() once at setup; the inner RedisStore (and
  // therefore the first Redis connection) is created on first use instead.
  // This keeps module import side-effect free so tests can inject an
  // ephemeral client before any command runs, and a failed creation is
  // retried on the next request (recovery after a Redis outage).
  init(options: RateLimitOptions): void {
    this.initOptions = options;
  }

  private ready(): Promise<RedisStore> {
    if (!this.readyPromise) {
      this.readyPromise = this.create().catch((error: unknown) => {
        this.readyPromise = null;
        throw error;
      });
    }
    return this.readyPromise;
  }

  private async create(): Promise<RedisStore> {
    const created = new RedisStore({
      prefix: this.redisPrefix,
      sendCommand: async (...args: string[]): Promise<RedisReply> => {
        try {
          // Method call (not an extracted reference) so ioredis keeps its
          // receiver; the cast only loosens the overload typing for raw
          // commands such as SCRIPT LOAD / EVALSHA.
          const redis = getRedis() as unknown as {
            call: (...callArgs: string[]) => Promise<unknown>;
          };
          return (await redis.call(...args)) as RedisReply;
        } catch (error) {
          throw toRedisUnavailableError(error);
        }
      },
    });
    if (this.initOptions) {
      await created.init(this.initOptions);
    }
    return created;
  }

  async increment(key: string): Promise<IncrementResponse> {
    return (await this.ready()).increment(key);
  }

  async decrement(key: string): Promise<void> {
    await (await this.ready()).decrement(key);
  }

  async resetKey(key: string): Promise<void> {
    await (await this.ready()).resetKey(key);
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    return (await this.ready()).get(key);
  }
}

const tooManyHandler = (req: Request, res: Response): void => {
  const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } })
    .rateLimit?.resetTime;
  if (resetTime) {
    const seconds = Math.max(
      1,
      Math.ceil((resetTime.getTime() - Date.now()) / 1000),
    );
    res.setHeader('Retry-After', String(seconds));
  }
  res.status(429).json({
    status: 'error',
    message: 'Too many requests. Please try again later.',
  });
};

interface LimiterSpec {
  windowMs: number;
  limit: number;
  identifier: string;
}

const buildIpLimiter = (prefix: string, spec: LimiterSpec) =>
  rateLimit({
    windowMs: spec.windowMs,
    limit: spec.limit,
    identifier: spec.identifier,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: makeStore(prefix),
    handler: tooManyHandler,
    // Fail closed on Redis errors: the error middleware turns the 503
    // AppError from the store into a safe response.
    passOnStoreError: false,
  });

const buildMobileLimiter = (prefix: string, spec: LimiterSpec) =>
  rateLimit({
    windowMs: spec.windowMs,
    limit: spec.limit,
    identifier: spec.identifier,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: makeStore(prefix),
    keyGenerator: mobileKey,
    skip: skipWithoutMobile,
    validate: noIpFallbackValidation,
    handler: tooManyHandler,
    passOnStoreError: false,
  });

const buildUserLimiter = (prefix: string, spec: LimiterSpec) =>
  rateLimit({
    windowMs: spec.windowMs,
    limit: spec.limit,
    identifier: spec.identifier,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: makeStore(prefix),
    keyGenerator: userKey,
    skip: skipWithoutUser,
    validate: noIpFallbackValidation,
    handler: tooManyHandler,
    passOnStoreError: false,
  });

// Defaults (env-overridable, see .env.example): generous enough for normal
// registration/login, strict enough to blunt enumeration and SMS-cost abuse.
// OTP request/verify additionally enforce store-level cooldowns, per-mobile
// resend caps, and per-challenge attempt limits.
export const otpRequestIpLimiter = buildIpLimiter('otp-req-ip', {
  windowMs: env.RL_OTP_REQUEST_IP_WINDOW_MS,
  limit: env.RL_OTP_REQUEST_IP_MAX,
  identifier: 'otp-request-ip',
});

export const otpRequestMobileLimiter = buildMobileLimiter('otp-req-mob', {
  windowMs: env.RL_OTP_REQUEST_MOBILE_WINDOW_MS,
  limit: env.RL_OTP_REQUEST_MOBILE_MAX,
  identifier: 'otp-request-mobile',
});

export const otpVerifyIpLimiter = buildIpLimiter('otp-verify-ip', {
  windowMs: env.RL_OTP_VERIFY_IP_WINDOW_MS,
  limit: env.RL_OTP_VERIFY_IP_MAX,
  identifier: 'otp-verify-ip',
});

export const otpVerifyMobileLimiter = buildMobileLimiter('otp-verify-mob', {
  windowMs: env.RL_OTP_VERIFY_MOBILE_WINDOW_MS,
  limit: env.RL_OTP_VERIFY_MOBILE_MAX,
  identifier: 'otp-verify-mobile',
});

export const refreshIpLimiter = buildIpLimiter('refresh-ip', {
  windowMs: env.RL_REFRESH_IP_WINDOW_MS,
  limit: env.RL_REFRESH_IP_MAX,
  identifier: 'session-refresh-ip',
});

export const registrationCompleteLimiter = buildIpLimiter('reg-complete-ip', {
  windowMs: env.RL_REGISTRATION_COMPLETE_IP_WINDOW_MS,
  limit: env.RL_REGISTRATION_COMPLETE_IP_MAX,
  identifier: 'registration-complete-ip',
});

export const invitationCreateUserLimiter = buildUserLimiter('inv-create-uid', {
  windowMs: env.RL_INVITATION_CREATE_USER_WINDOW_MS,
  limit: env.RL_INVITATION_CREATE_USER_MAX,
  identifier: 'invitation-create-user',
});

export const invitationAcceptIpLimiter = buildIpLimiter('inv-accept-ip', {
  windowMs: env.RL_INVITATION_ACCEPT_IP_WINDOW_MS,
  limit: env.RL_INVITATION_ACCEPT_IP_MAX,
  identifier: 'invitation-accept-ip',
});

export const paymentOrderUserLimiter = buildUserLimiter('pay-order-uid', {
  windowMs: env.RL_PAYMENT_ORDER_USER_WINDOW_MS,
  limit: env.RL_PAYMENT_ORDER_USER_MAX,
  identifier: 'payment-order-user',
});

export const candidatesIpLimiter = buildIpLimiter('candidates-ip', {
  windowMs: env.RL_CANDIDATES_IP_WINDOW_MS,
  limit: env.RL_CANDIDATES_IP_MAX,
  identifier: 'candidate-search-ip',
});
