import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Redis } from 'ioredis';
import { AppError } from '../../shared/errors/appError.js';
import * as AuthService from './auth.service.js';
import * as RegistrationService from '../registration/registration.service.js';
import {
  claimVerificationProof,
  requestChallenge,
  seedChallengeForTest,
  verifyChallenge,
} from './otpChallenge.store.js';
import {
  consoleOtpDelivery,
  isOtpLoggingAllowed,
} from '../../shared/auth/otpDelivery.js';
import { setRedisForTests } from '../../config/redis.js';
import {
  TEST_OTP,
  cleanupMobile,
  closeTestPool,
  completeTestRegistration,
  registerApprovedHead,
  registrationInput,
  seedAdmin,
  seedPendingOtp,
  testMobile,
  verifyTestOtp,
} from '../../test-utils/integration-db.js';
import {
  closeTestRedis,
  ensureTestRedis,
  flushTestRedis,
} from '../../test-utils/redis-test.js';

after(async () => {
  await closeTestRedis();
  await closeTestPool();
});

beforeEach(async () => {
  await ensureTestRedis();
  await flushTestRedis();
});

const rejectsWith = async (
  fn: () => Promise<unknown>,
  statusCode: number,
): Promise<AppError> => {
  try {
    await fn();
  } catch (error) {
    assert.ok(error instanceof AppError);
    assert.equal((error as AppError).statusCode, statusCode);
    return error as AppError;
  }
  assert.fail(`expected AppError(${statusCode})`);
};

// Documented key layout (see otpChallenge.store.ts): tests bypass the
// resend cooldown by deleting the cooldown flag, simulating time passing.
const cooldownKeyFor = (mobile: string, purpose: string): string => {
  const hash = crypto.createHash('sha256').update(mobile).digest('hex');
  return `otp:cd:v1:${purpose}:${hash}`;
};

describe('redis OTP challenge lifecycle', () => {
  it('request → verify succeeds once; replay fails; proof is single-use', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedChallengeForTest(mobile, 'REGISTRATION', TEST_OTP);
      const verified = await verifyChallenge(mobile, TEST_OTP);
      assert.equal(verified.purpose, 'REGISTRATION');

      await rejectsWith(() => verifyChallenge(mobile, TEST_OTP), 401);

      assert.equal(await claimVerificationProof(mobile, 'REGISTRATION'), true);
      assert.equal(await claimVerificationProof(mobile, 'REGISTRATION'), false);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('wrong codes are rejected and five failures burn the challenge', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedChallengeForTest(mobile, 'LOGIN', TEST_OTP);
      for (let i = 0; i < 5; i += 1) {
        await rejectsWith(() => verifyChallenge(mobile, '000000'), 401);
      }
      await rejectsWith(() => verifyChallenge(mobile, TEST_OTP), 401);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('expired (absent) challenges are rejected', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'LOGIN', TEST_OTP, -1);
      await rejectsWith(() => AuthService.verifyOtp({ mobile, code: TEST_OTP }), 401);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('resend cooldown then per-mobile resend cap', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      const redis = await ensureTestRedis();
      await AuthService.requestOtp({ mobile, purpose: 'LOGIN' });

      const cooldown = await rejectsWith(
        () => AuthService.requestOtp({ mobile, purpose: 'LOGIN' }),
        429,
      );
      assert.match(cooldown.message, /wait/i);

      // Simulate cooldown windows passing; the 6th request trips the cap.
      let capped: AppError | null = null;
      for (let i = 0; i < 5; i += 1) {
        await redis.del(cooldownKeyFor(mobile, 'LOGIN'));
        try {
          await AuthService.requestOtp({ mobile, purpose: 'LOGIN' });
        } catch (error) {
          assert.ok(error instanceof AppError);
          capped = error;
          break;
        }
      }
      assert.ok(capped);
      assert.equal(capped.statusCode, 429);
      assert.match(capped.message, /too many/i);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('concurrent verification: exactly one request consumes the challenge', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedChallengeForTest(mobile, 'INVITATION', TEST_OTP);
      const outcomes = await Promise.allSettled(
        Array.from({ length: 8 }, () => verifyChallenge(mobile, TEST_OTP)),
      );
      const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
      const rejected = outcomes.filter((o) => o.status === 'rejected');
      assert.equal(fulfilled.length, 1);
      assert.equal(rejected.length, 7);
      for (const outcome of rejected) {
        const reason = (outcome as PromiseRejectedResult).reason;
        assert.ok(reason instanceof AppError);
        assert.equal((reason as AppError).statusCode, 401);
      }
      // The single winner left exactly one claimable proof.
      assert.equal(await claimVerificationProof(mobile, 'INVITATION'), true);
      assert.equal(await claimVerificationProof(mobile, 'INVITATION'), false);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('purpose mismatch fails closed without consuming the challenge', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedChallengeForTest(mobile, 'REGISTRATION', TEST_OTP);
      await rejectsWith(() => verifyChallenge(mobile, TEST_OTP, 'LOGIN'), 401);
      // The challenge survived the mismatch: unqualified verify still works
      // and reports the bound purpose.
      const verified = await verifyChallenge(mobile, TEST_OTP);
      assert.equal(verified.purpose, 'REGISTRATION');
    } finally {
      await cleanupMobile(mobile);
    }
  });
});

describe('purpose-bound session issuance', () => {
  it('approved account: LOGIN challenge logs in, REGISTRATION challenge does not', async () => {
    const adminMobile = testMobile();
    const headMobile = testMobile();
    await cleanupMobile(adminMobile);
    await cleanupMobile(headMobile);
    try {
      const adminId = await seedAdmin(adminMobile);
      await registerApprovedHead(headMobile, adminId);

      await seedPendingOtp(headMobile, 'REGISTRATION');
      const crossPurpose = await verifyTestOtp(headMobile);
      assert.equal(crossPurpose.verified, true);
      assert.equal(crossPurpose.nextAction, 'CONTACT_SUPPORT');
      assert.equal(crossPurpose.accessToken, undefined);

      await seedPendingOtp(headMobile, 'LOGIN');
      const login = await verifyTestOtp(headMobile);
      assert.equal(login.nextAction, 'LOGGED_IN');
      assert.ok(login.accessToken);
    } finally {
      await cleanupMobile(headMobile);
      await cleanupMobile(adminMobile);
    }
  });

  it('a LOGIN proof is not a registration proof', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'LOGIN');
      await verifyTestOtp(mobile);
      await rejectsWith(
        () => RegistrationService.completeRegistration(registrationInput(mobile)),
        401,
      );
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('registration proof survives verification and completes registration', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      const outcome = await verifyTestOtp(mobile);
      assert.equal(outcome.nextAction, 'COMPLETE_REGISTRATION');
      const result = await completeTestRegistration(mobile);
      assert.equal(result.status, 'PENDING');
    } finally {
      await cleanupMobile(mobile);
    }
  });
});

describe('redis failure behavior', () => {
  it('OTP paths fail closed with 503 when Redis is unreachable', async () => {
    const mobile = testMobile();
    const dead = new Redis({
      host: '127.0.0.1',
      port: 1,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 500,
      retryStrategy: () => null,
    });
    dead.on('error', () => {});
    setRedisForTests(dead);
    try {
      await rejectsWith(() => requestChallenge(mobile, 'LOGIN'), 503);
      await rejectsWith(() => verifyChallenge(mobile, TEST_OTP), 503);
      await rejectsWith(() => claimVerificationProof(mobile, 'LOGIN'), 503);
      await rejectsWith(
        () => AuthService.requestOtp({ mobile, purpose: 'LOGIN' }),
        503,
      );
    } finally {
      setRedisForTests(await ensureTestRedis());
      dead.disconnect();
    }
  });
});

describe('development OTP logging gate', () => {
  it('logging is disabled in production and allowed elsewhere', () => {
    assert.equal(isOtpLoggingAllowed('production'), false);
    assert.equal(isOtpLoggingAllowed('development'), true);
    assert.equal(isOtpLoggingAllowed('test'), true);
  });

  it('the console delivery adapter never throws and never returns the code', async () => {
    const result = await consoleOtpDelivery.sendOtp({
      mobile: testMobile(),
      code: TEST_OTP,
      purpose: 'LOGIN',
      expiresAt: new Date(),
    });
    assert.equal(result, undefined);
  });
});
