import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import * as RegistrationService from './registration.service.js';
import {
  claimVerificationProof,
  seedProofForTest,
} from '../auth/otpChallenge.store.js';
import {
  cleanupMobile,
  closeTestPool,
  completeTestRegistration,
  countRecordsForMobile,
  registrationInput,
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
): Promise<void> => {
  try {
    await fn();
  } catch (error) {
    assert.ok(error instanceof AppError);
    assert.equal((error as AppError).statusCode, statusCode);
    return;
  }
  assert.fail(`expected AppError(${statusCode})`);
};

// Registration (cases 6–7) + proof security (cases 11–15).

describe('community registration', () => {
  it('6. new mobile registers: PENDING family, head member, account, middle name kept', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      const result = await completeTestRegistration(mobile);

      assert.equal(result.status, 'PENDING');
      assert.match(result.familyCode, /^MM-\d{4}-[0-9A-F]{6}$/);

      const rows = await pool.query(
        `SELECT m.first_name, m.middle_name, m.last_name, m.is_head, m.status,
                f.status AS family_status, a.role
         FROM members m
         JOIN families f ON f.id = m.family_id
         JOIN accounts a ON a.member_id = m.id
         WHERE a.mobile = $1`,
        [mobile],
      );
      assert.equal(rows.rowCount, 1);
      assert.equal(rows.rows[0].middle_name, 'K');
      assert.equal(rows.rows[0].is_head, true);
      assert.equal(rows.rows[0].status, 'PENDING');
      assert.equal(rows.rows[0].family_status, 'PENDING');
      assert.equal(rows.rows[0].role, 'MEMBER');
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('7. already-registered mobile cannot register again', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      await completeTestRegistration(mobile);

      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      await rejectsWith(
        () => RegistrationService.completeRegistration(registrationInput(mobile)),
        409,
      );
    } finally {
      await cleanupMobile(mobile);
    }
  });
});

describe('registration proof security', () => {
  it('11. expired proof is rejected', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      // A proof with a 1-second TTL expires before it can be claimed.
      await seedProofForTest(mobile, 'REGISTRATION', 1);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await rejectsWith(
        () => RegistrationService.completeRegistration(registrationInput(mobile)),
        401,
      );
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('12. proof is single-use: direct double-claim fails', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      const first = await claimVerificationProof(mobile, 'REGISTRATION');
      assert.equal(first, true);
      const second = await claimVerificationProof(mobile, 'REGISTRATION');
      assert.equal(second, false);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('13. proof cannot be used with a different mobile', async () => {
    const mobileA = testMobile();
    const mobileB = testMobile();
    await cleanupMobile(mobileA);
    await cleanupMobile(mobileB);
    try {
      await seedPendingOtp(mobileA, 'REGISTRATION');
      await verifyTestOtp(mobileA);
      await rejectsWith(
        () =>
          RegistrationService.completeRegistration({
            ...registrationInput(mobileB),
            mobile: mobileB,
          }),
        401,
      );
      // And B has no partial records.
      assert.deepEqual(await countRecordsForMobile(mobileB), {
        families: 0,
        members: 0,
        accounts: 0,
      });
    } finally {
      await cleanupMobile(mobileA);
      await cleanupMobile(mobileB);
    }
  });

  it('14. proof is flow-bound: REGISTRATION proof cannot claim INVITATION', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      const claimed = await claimVerificationProof(mobile, 'INVITATION');
      assert.equal(claimed, false);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('15. failed duplicate registration leaves no orphaned records', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      await completeTestRegistration(mobile);

      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      await rejectsWith(
        () => RegistrationService.completeRegistration(registrationInput(mobile)),
        409,
      );
      assert.deepEqual(await countRecordsForMobile(mobile), {
        families: 1,
        members: 1,
        accounts: 1,
      });
    } finally {
      await cleanupMobile(mobile);
    }
  });
});
