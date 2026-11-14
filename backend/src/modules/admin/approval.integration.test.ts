import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AdminService from './admin.service.js';
import {
  cleanupMobile,
  closeTestPool,
  completeTestRegistration,
  seedPendingOtp,
  testMobile,
  verifyTestOtp,
} from '../../test-utils/integration-db.js';
import { closeTestRedis } from '../../test-utils/redis-test.js';

// Registration approval/rejection transitions (shared-link admin flow).

after(async () => {
  await closeTestRedis();
  await closeTestPool();
});

const pendingRegistration = async () => {
  const mobile = testMobile();
  await cleanupMobile(mobile);
  await seedPendingOtp(mobile, 'REGISTRATION');
  await verifyTestOtp(mobile);
  const reg = await completeTestRegistration(mobile);
  return { mobile, familyId: reg.familyId };
};

describe('approval transitions', () => {
  it('20a. approve: PENDING → ACTIVE family + APPROVED head, then login works', async () => {
    const { mobile, familyId } = await pendingRegistration();
    try {
      const updated = await AdminService.approveRegistration(familyId);
      assert.equal(updated.family.status, 'ACTIVE');

      const rows = await pool.query(
        `SELECT m.status FROM members m
         JOIN accounts a ON a.member_id = m.id WHERE a.mobile = $1`,
        [mobile],
      );
      assert.equal(rows.rows[0].status, 'APPROVED');

      await seedPendingOtp(mobile, 'LOGIN');
      const outcome = await verifyTestOtp(mobile);
      assert.equal(outcome.nextAction, 'LOGGED_IN');
      assert.ok(outcome.accessToken);
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('20b. reject: records retained as REJECTED (audit trail), double-decide rejected', async () => {
    const { mobile, familyId } = await pendingRegistration();
    try {
      const updated = await AdminService.rejectRegistration(familyId);
      assert.equal(updated.family.status, 'REJECTED');

      const rows = await pool.query(
        `SELECT m.id, m.status AS member_status, f.status AS family_status
         FROM members m
         JOIN families f ON f.id = m.family_id
         JOIN accounts a ON a.member_id = m.id
         WHERE a.mobile = $1`,
        [mobile],
      );
      assert.equal(rows.rowCount, 1);
      assert.equal(rows.rows[0].member_status, 'REJECTED');
      assert.equal(rows.rows[0].family_status, 'REJECTED');

      // Deciding twice is a conflict, never a silent overwrite.
      await assert.rejects(() => AdminService.approveRegistration(familyId), (e: unknown) => {
        assert.ok(e instanceof AppError && e.statusCode === 409);
        return true;
      });
      await assert.rejects(() => AdminService.rejectRegistration(familyId), (e: unknown) => {
        assert.ok(e instanceof AppError && e.statusCode === 409);
        return true;
      });
    } finally {
      await cleanupMobile(mobile);
    }
  });

  it('20c. decisions persist a NULL approver (shared-link admin has no member identity)', async () => {
    const { mobile, familyId } = await pendingRegistration();
    try {
      await AdminService.approveRegistration(familyId);
      const rows = await pool.query(
        `SELECT approved_by_member_id, approved_at FROM families WHERE id = $1`,
        [familyId],
      );
      assert.equal(rows.rows[0].approved_by_member_id, null);
      assert.ok(rows.rows[0].approved_at);
    } finally {
      await cleanupMobile(mobile);
    }
  });
});
