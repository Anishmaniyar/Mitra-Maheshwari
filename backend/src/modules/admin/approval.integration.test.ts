import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import { authorize } from '../../middleware/authorize.js';
import type { AuthUser } from '../../shared/types/auth.types.js';
import * as AdminService from './admin.service.js';
import {
  cleanupMobile,
  closeTestPool,
  completeTestRegistration,
  seedAdmin,
  seedPendingOtp,
  testMobile,
  verifyTestOtp,
} from '../../test-utils/integration-db.js';
import { closeTestRedis } from '../../test-utils/redis-test.js';

// Admin approval (cases 19–20): route boundary + approve/reject transitions.

let adminId = '';
let adminMobile = '';

before(async () => {
  adminMobile = testMobile();
  adminId = await seedAdmin(adminMobile);
});

after(async () => {
  await cleanupMobile(adminMobile);
  await closeTestRedis();
  await closeTestPool();
});

const memberUser = (role: AuthUser['role']): AuthUser => ({
  memberId: '00000000-0000-4000-8000-000000000000',
  role,
  familyId: '00000000-0000-4000-8000-000000000001',
  isFamilyHead: false,
  jti: '00000000-0000-4000-8000-000000000002',
});

describe('admin authorization boundary', () => {
  it('19. a MEMBER cannot pass authorize(ADMIN)', () => {
    assert.throws(
      () =>
        authorize('ADMIN')(
          { user: memberUser('MEMBER') } as Request,
          {} as Response,
          () => {},
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal((error as AppError).statusCode, 403);
        return true;
      },
    );
  });

  it('19b. an ADMIN passes authorize(ADMIN)', () => {
    let nextCalled = false;
    authorize('ADMIN')({ user: memberUser('ADMIN') } as Request, {} as Response, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });
});

describe('approval transitions', () => {
  it('20a. approve: PENDING → ACTIVE family + APPROVED head, then login works', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      const reg = await completeTestRegistration(mobile);

      const updated = await AdminService.approveRegistration(reg.familyId, adminId);
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
    const mobile = testMobile();
    await cleanupMobile(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      const reg = await completeTestRegistration(mobile);

      const updated = await AdminService.rejectRegistration(reg.familyId);
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
      await assert.rejects(() => AdminService.approveRegistration(reg.familyId, adminId), (e: unknown) => {
        assert.ok(e instanceof AppError && e.statusCode === 409);
        return true;
      });
      await assert.rejects(() => AdminService.rejectRegistration(reg.familyId), (e: unknown) => {
        assert.ok(e instanceof AppError && e.statusCode === 409);
        return true;
      });
    } finally {
      await cleanupMobile(mobile);
    }
  });
});
