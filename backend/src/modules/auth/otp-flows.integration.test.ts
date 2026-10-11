import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import { verifyAccessToken } from '../../shared/auth/jwt.js';
import * as AuthService from './auth.service.js';
import * as AdminService from '../admin/admin.service.js';
import {
  TEST_OTP,
  cleanupMobile,
  closeTestPool,
  completeTestRegistration,
  seedAdmin,
  seedPendingOtp,
  testMobile,
  verifyTestOtp,
} from '../../test-utils/integration-db.js';
import { closeTestRedis } from '../../test-utils/redis-test.js';

after(async () => {
  await closeTestRedis();
  await closeTestPool();
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

// OTP lifecycle (cases 1–5) + login outcomes (cases 8–10).

describe('otp verification lifecycle', () => {
  it('1. correct OTP verifies a new mobile with an explicit next action', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      const outcome = await verifyTestOtp(mobile);
      assert.equal(outcome.verified, true);
      assert.equal(outcome.accountStatus, 'NONE');
      assert.equal(outcome.nextAction, 'COMPLETE_REGISTRATION');
      assert.equal(outcome.accessToken, undefined);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('2. incorrect OTP is rejected and the challenge survives one failure', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'LOGIN');
      await rejectsWith(() => verifyTestOtp(mobile, '000000'), 401);
      // The challenge is still alive: the correct code verifies afterwards.
      const outcome = await verifyTestOtp(mobile);
      assert.equal(outcome.verified, true);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('3. expired OTP is rejected', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'LOGIN', TEST_OTP, -1);
      await rejectsWith(() => verifyTestOtp(mobile), 401);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('4. OTP is burned after the attempt limit, even for the correct code', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'LOGIN');
      for (let i = 0; i < 5; i += 1) {
        await rejectsWith(() => verifyTestOtp(mobile, '000000'), 401);
      }
      await rejectsWith(() => verifyTestOtp(mobile, TEST_OTP), 401);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('5. a consumed OTP can never verify again', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'LOGIN');
      await verifyTestOtp(mobile);
      await rejectsWith(() => verifyTestOtp(mobile, TEST_OTP), 401);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('request-otp respects the resend cooldown', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await AuthService.requestOtp({ mobile, purpose: 'LOGIN' });
      await rejectsWith(
        () => AuthService.requestOtp({ mobile, purpose: 'LOGIN' }),
        429,
      );
    } finally {
      await cleanupMobile(mobile);
    }
  });
});

describe('login outcomes by account state', () => {
  it('8. pending account: explicit awaiting-approval outcome, no session', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      await completeTestRegistration(mobile);

      await seedPendingOtp(mobile, 'LOGIN');
      const outcome = await verifyTestOtp(mobile);
      assert.equal(outcome.verified, true);
      assert.equal(outcome.accountStatus, 'PENDING');
      assert.equal(outcome.nextAction, 'AWAITING_APPROVAL');
      assert.equal(outcome.accessToken, undefined);
      assert.equal(outcome.member, undefined);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('9. approved account: session issued with a verifiable MEMBER JWT', async () => {
    const mobile = testMobile();
    const adminMobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      const reg = await completeTestRegistration(mobile);
      const adminId = await seedAdmin(adminMobile);
      await AdminService.approveRegistration(reg.familyId, adminId);

      await seedPendingOtp(mobile, 'LOGIN');
      const outcome = await verifyTestOtp(mobile);
      assert.equal(outcome.nextAction, 'LOGGED_IN');
      assert.ok(outcome.accessToken);
      assert.ok(outcome.member);
      const decoded = verifyAccessToken(outcome.accessToken as string);
      assert.equal(decoded.role, 'MEMBER');
      assert.equal(decoded.sub, (outcome.member as { id: string }).id);
    } finally {
      await cleanupMobile(mobile);
      await cleanupMobile(adminMobile);
    }
  });

  it('10. rejected account: explicit contact-support outcome, no session', async () => {
    const mobile = testMobile();
    const adminMobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      const reg = await completeTestRegistration(mobile);
      const adminId = await seedAdmin(adminMobile);
      await AdminService.rejectRegistration(reg.familyId);

      await seedPendingOtp(mobile, 'LOGIN');
      const outcome = await verifyTestOtp(mobile);
      assert.equal(outcome.accountStatus, 'REJECTED');
      assert.equal(outcome.nextAction, 'CONTACT_SUPPORT');
      assert.equal(outcome.accessToken, undefined);

      // Audit trail: rejected records are retained, not deleted.
      const kept = await pool.query(
        `SELECT m.status AS member_status, f.status AS family_status
         FROM members m JOIN families f ON f.id = m.family_id
         JOIN accounts a ON a.member_id = m.id
         WHERE a.mobile = $1`,
        [mobile],
      );
      assert.equal(kept.rows[0].member_status, 'REJECTED');
      assert.equal(kept.rows[0].family_status, 'REJECTED');
    } finally {
      await cleanupMobile(mobile);
      await cleanupMobile(adminMobile);
    }
  });
});
