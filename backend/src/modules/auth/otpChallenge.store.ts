import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import { getRedis, toRedisUnavailableError } from '../../config/redis.js';
import { generateOtp, hashOtp } from '../../shared/auth/otp.js';

// Redis-backed OTP challenge lifecycle. Temporary challenge state lives here,
// never in PostgreSQL: the `otps` table and its migrations are retained
// untouched for history/audit, but new challenges are not written there.
//
// Key layout (mobile is SHA-256 hashed: no PII, OTPs, or tokens in key names):
//   otp:ch:v1:{purpose}:{mobHash}    Hash {h,a,c,p} + TTL (the challenge)
//   otp:cur:v1:{mobHash}              latest-requested purpose + TTL (unqualified verify)
//   otp:cd:v1:{purpose}:{mobHash}    resend-cooldown flag + TTL
//   otp:rs:v1:{purpose}:{mobHash}    per-mobile resend counter + TTL window
//   otp:proof:v1:{purpose}:{mobHash} single-use verification proof + TTL
// Rate-limit counters use the separate `rl:` prefix (middleware/rateLimit.ts).

export const OTP_PURPOSES = ['LOGIN', 'REGISTRATION', 'INVITATION'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

const MOBILE_RE = /^\+?[0-9]{10,15}$/;
const CODE_RE = /^[0-9]{6}$/;

export const normalizeMobile = (mobile: string): string => mobile.trim();

const assertValidMobile = (mobile: string): string => {
  const normalized = normalizeMobile(mobile);
  if (!MOBILE_RE.test(normalized)) {
    throw new AppError('Invalid mobile number', 400);
  }
  return normalized;
};

const assertValidPurpose = (purpose: string): OtpPurpose => {
  if (!OTP_PURPOSES.includes(purpose as OtpPurpose)) {
    throw new AppError('Invalid OTP purpose', 400);
  }
  return purpose as OtpPurpose;
};

const mobileHash = (normalizedMobile: string): string =>
  crypto.createHash('sha256').update(normalizedMobile).digest('hex');

const challengeKey = (purpose: OtpPurpose, mobHash: string): string =>
  `otp:ch:v1:${purpose}:${mobHash}`;
const currentKey = (mobHash: string): string => `otp:cur:v1:${mobHash}`;
const cooldownKey = (purpose: OtpPurpose, mobHash: string): string =>
  `otp:cd:v1:${purpose}:${mobHash}`;
const resendKey = (purpose: OtpPurpose, mobHash: string): string =>
  `otp:rs:v1:${purpose}:${mobHash}`;
export const proofKey = (purpose: OtpPurpose, mobHash: string): string =>
  `otp:proof:v1:${purpose}:${mobHash}`;

// Atomically: reject missing/consumed/exhausted challenges, count a failed
// attempt on wrong codes, and on a correct code consume the challenge and
// issue the single-use verification proof. The hash comparison avoids early
// exit so concurrent requests cannot consume the same OTP twice and only the
// first correct guess wins.
// Returns 1 (verified+consumed+proof issued), -1 (missing/expired),
// -2 (already consumed), -3 (attempts exhausted), -4 (wrong code, counted),
// -5 (purpose mismatch; no state changed).
const VERIFY_LUA = `
local fields = redis.call('HGETALL', KEYS[1])
if #fields == 0 then
  return -1
end
local h = {}
for i = 1, #fields, 2 do
  h[fields[i]] = fields[i + 1]
end
if h['c'] == '1' then
  return -2
end
if (tonumber(h['a']) or 0) >= tonumber(ARGV[2]) then
  return -3
end
if ARGV[5] ~= '' and h['p'] ~= ARGV[5] then
  return -5
end
local stored = h['h'] or ''
local presented = ARGV[1] or ''
local match = true
if string.len(stored) ~= string.len(presented) then
  match = false
else
  local diff = 0
  for i = 1, string.len(stored) do
    if string.byte(stored, i) ~= string.byte(presented, i) then
      diff = diff + 1
    end
  end
  if diff ~= 0 then
    match = false
  end
end
if match == false then
  redis.call('HINCRBY', KEYS[1], 'a', 1)
  return -4
end
redis.call('HSET', KEYS[1], 'c', '1')
redis.call('SET', KEYS[2], ARGV[3], 'EX', ARGV[4])
redis.call('DEL', KEYS[1])
return 1
`;

// Atomically claims (GET + DEL) the single-use verification proof.
const CLAIM_LUA = `
local v = redis.call('GET', KEYS[1])
if v then
  redis.call('DEL', KEYS[1])
  return 1
else
  return 0
end
`;

export interface RequestedChallenge {
  code: string;
  expiresAt: Date;
}

export const requestChallenge = async (
  mobile: string,
  purpose: string,
): Promise<RequestedChallenge> => {
  const normalized = assertValidMobile(mobile);
  const boundPurpose = assertValidPurpose(purpose);
  const hash = mobileHash(normalized);
  const redis = getRedis();

  try {
    // Atomic cooldown: only the first requester in the window proceeds.
    const cooldown = await redis.set(
      cooldownKey(boundPurpose, hash),
      '1',
      'EX',
      env.OTP_RESEND_COOLDOWN_SECONDS,
      'NX',
    );
    if (!cooldown) {
      throw new AppError('Please wait before requesting another OTP', 429);
    }

    // Per-mobile resend cap inside a fixed TTL window.
    const resends = await redis.incr(resendKey(boundPurpose, hash));
    if (resends === 1) {
      await redis.expire(resendKey(boundPurpose, hash), env.OTP_RESEND_WINDOW_SECONDS);
    }
    if (resends > env.OTP_MAX_RESENDS) {
      throw new AppError('Too many OTP requests. Please try again later', 429);
    }

    // A fresh challenge supersedes any previous one for this mobile+purpose
    // (same "latest wins" rule as the previous PostgreSQL implementation).
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);
    const pipeline = redis.pipeline();
    pipeline.hset(challengeKey(boundPurpose, hash), {
      h: hashOtp(code),
      a: '0',
      c: '0',
      p: boundPurpose,
    });
    pipeline.expire(challengeKey(boundPurpose, hash), env.OTP_EXPIRY_SECONDS);
    // Latest-wins pointer: an unqualified verify consumes the most recently
    // requested challenge only (same rule as the previous implementation).
    pipeline.set(currentKey(hash), boundPurpose, 'EX', env.OTP_EXPIRY_SECONDS);
    await pipeline.exec();

    return { code, expiresAt };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw toRedisUnavailableError(error);
  }
};

export interface VerifiedChallenge {
  purpose: OtpPurpose;
}

export const verifyChallenge = async (
  mobile: string,
  code: string,
  expectedPurpose?: string,
): Promise<VerifiedChallenge> => {
  const normalized = assertValidMobile(mobile);
  if (!CODE_RE.test(code.trim())) {
    throw new AppError('Invalid or expired OTP', 401);
  }
  if (expectedPurpose !== undefined) {
    assertValidPurpose(expectedPurpose);
  }
  const hash = mobileHash(normalized);
  const redis = getRedis();

  // The challenge's bound purpose is authoritative. The caller-supplied
  // purpose (if any) must match it; callers that omit it verify against the
  // latest requested challenge and learn its bound purpose from the result,
  // so one guess touches at most one challenge and never probes purposes.
  try {
    let candidate: OtpPurpose;
    if (expectedPurpose !== undefined) {
      candidate = expectedPurpose as OtpPurpose;
    } else {
      const current = await redis.get(currentKey(hash));
      if (!current || !OTP_PURPOSES.includes(current as OtpPurpose)) {
        throw new AppError('Invalid or expired OTP', 401);
      }
      candidate = current as OtpPurpose;
    }

    const result = (await redis.eval(
      VERIFY_LUA,
      2,
      challengeKey(candidate, hash),
      proofKey(candidate, hash),
      hashOtp(code.trim()),
      String(env.OTP_MAX_ATTEMPTS),
      crypto.randomBytes(16).toString('hex'),
      String(env.OTP_PROOF_TTL_SECONDS),
      expectedPurpose ?? '',
    )) as number;

    if (result === 1) {
      return { purpose: candidate };
    }
    // -1 missing/expired, -2 consumed, -3 exhausted, -4 wrong code
    // (counted), -5 purpose mismatch (no state changed).
    throw new AppError('Invalid or expired OTP', 401);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw toRedisUnavailableError(error);
  }
};

// Claims the single-use verification proof for (mobile, purpose).
// Returns true exactly once per verification; false when absent/expired or
// already claimed. Never throws for a missing proof (caller maps to 401).
export const claimVerificationProof = async (
  mobile: string,
  purpose: string,
): Promise<boolean> => {
  const normalized = assertValidMobile(mobile);
  const boundPurpose = assertValidPurpose(purpose);
  const redis = getRedis();

  try {
    const result = (await redis.eval(
      CLAIM_LUA,
      1,
      proofKey(boundPurpose, mobileHash(normalized)),
    )) as number;
    return result === 1;
  } catch (error) {
    throw toRedisUnavailableError(error);
  }
};

// Test/maintenance cleanup: removes every OTP key for a mobile across all
// purposes (current pointer, challenges, proofs, cooldowns, resend counters).
export const deleteOtpStateForMobile = async (mobile: string): Promise<void> => {
  const normalized = normalizeMobile(mobile);
  if (!MOBILE_RE.test(normalized)) {
    return;
  }
  const hash = mobileHash(normalized);
  const keys: string[] = [currentKey(hash)];
  for (const purpose of OTP_PURPOSES) {
    keys.push(
      challengeKey(purpose, hash),
      proofKey(purpose, hash),
      cooldownKey(purpose, hash),
      resendKey(purpose, hash),
    );
  }
  try {
    await getRedis().del(...keys);
  } catch (error) {
    throw toRedisUnavailableError(error);
  }
};

// Test-only seeding (mirrors the old direct-DB seeding practice). Refuses to
// run in production so tests can never mint challenges against live Redis.
export const seedChallengeForTest = async (
  mobile: string,
  purpose: string,
  code: string,
  ttlSeconds = 300,
): Promise<void> => {
  if (env.NODE_ENV === 'production') {
    throw new AppError('Test seeding is not available in production', 403);
  }
  const normalized = assertValidMobile(mobile);
  const boundPurpose = assertValidPurpose(purpose);
  if (!CODE_RE.test(code)) {
    throw new AppError('Invalid OTP code', 400);
  }
  const redis = getRedis();
  const ttl = Math.max(ttlSeconds, 1);
  const pipeline = redis.pipeline();
  pipeline.hset(challengeKey(boundPurpose, mobileHash(normalized)), {
    h: hashOtp(code),
    a: '0',
    c: '0',
    p: boundPurpose,
  });
  pipeline.expire(challengeKey(boundPurpose, mobileHash(normalized)), ttl);
  pipeline.set(currentKey(mobileHash(normalized)), boundPurpose, 'EX', ttl);
  await pipeline.exec();
};

export const seedProofForTest = async (
  mobile: string,
  purpose: string,
  ttlSeconds = 900,
): Promise<void> => {
  if (env.NODE_ENV === 'production') {
    throw new AppError('Test seeding is not available in production', 403);
  }
  const normalized = assertValidMobile(mobile);
  const boundPurpose = assertValidPurpose(purpose);
  await getRedis().set(
    proofKey(boundPurpose, mobileHash(normalized)),
    crypto.randomBytes(16).toString('hex'),
    'EX',
    Math.max(ttlSeconds, 1),
  );
};
