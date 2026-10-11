import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors/appError.js';
import * as FamilyService from './family.service.js';
import {
  cleanupMobile,
  closeTestPool,
  registerApprovedHead,
  seedAdmin,
  seedPendingOtp,
  testMobile,
  verifyTestOtp,
} from '../../test-utils/integration-db.js';
import { closeTestRedis } from '../../test-utils/redis-test.js';

// Invitation acceptance (cases 14b, 16–18). One approved head household is
// shared; invitee mobiles are cleaned per test.

let adminId = '';
let headMemberId = '';
let headFamilyId = '';

before(async () => {
  const adminMobile = testMobile();
  const headMobile = testMobile();
  (globalThis as { __headMobile?: string }).__headMobile = headMobile;
  (globalThis as { __adminMobile?: string }).__adminMobile = adminMobile;
  adminId = await seedAdmin(adminMobile);
  const head = await registerApprovedHead(headMobile, adminId);
  headMemberId = head.memberId;
  headFamilyId = head.familyId;
});

after(async () => {
  const g = globalThis as { __headMobile?: string; __adminMobile?: string };
  if (g.__headMobile) await cleanupMobile(g.__headMobile);
  if (g.__adminMobile) await cleanupMobile(g.__adminMobile);
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

const invite = (mobile: string) =>
  FamilyService.createInvitation(headMemberId, {
    inviteeName: `Invitee ${mobile.slice(-4)}`,
    inviteeMobile: mobile,
    expiresInDays: 7,
  });

const acceptInput = (mobile: string) => ({
  mobile,
  firstName: 'Inv',
  lastName: `User${mobile.slice(-4)}`,
});

const memberCountFor = async (mobile: string): Promise<number> => {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS n FROM members m
     LEFT JOIN accounts a ON a.member_id = m.id
     WHERE a.mobile = $1 OR m.mobile = $1`,
    [mobile],
  );
  return r.rows[0].n as number;
};

describe('invitation validation', () => {
  it('16a. expired invitation cannot be validated or accepted', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    const invitation = await invite(mobile);
    try {
      await pool.query(
        `UPDATE family_invitations SET expires_at = now() - interval '1 day' WHERE id = $1`,
        [invitation.id],
      );
      await rejectsWith(() => FamilyService.validateInvitation(invitation.token), 410);

      await seedPendingOtp(mobile, 'INVITATION');
      await verifyTestOtp(mobile);
      await rejectsWith(
        () => FamilyService.acceptInvitation(invitation.token, acceptInput(mobile)),
        410,
      );
    } finally {
      await pool.query(`DELETE FROM family_invitations WHERE id = $1`, [
        invitation.id,
      ]);
      await cleanupMobile(mobile);
    }
  });

  it('16b. cancelled invitation cannot be validated or accepted', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    const invitation = await invite(mobile);
    try {
      await FamilyService.cancelInvitation(headMemberId, invitation.id);
      await rejectsWith(() => FamilyService.validateInvitation(invitation.token), 410);

      await seedPendingOtp(mobile, 'INVITATION');
      await verifyTestOtp(mobile);
      await rejectsWith(
        () => FamilyService.acceptInvitation(invitation.token, acceptInput(mobile)),
        410,
      );
    } finally {
      await pool.query(`DELETE FROM family_invitations WHERE id = $1`, [
        invitation.id,
      ]);
      await cleanupMobile(mobile);
    }
  });
});

describe('invitation acceptance', () => {
  it('accepts into the invited family as a non-head APPROVED member', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    const invitation = await invite(mobile);
    try {
      await seedPendingOtp(mobile, 'INVITATION');
      await verifyTestOtp(mobile);
      const result = await FamilyService.acceptInvitation(
        invitation.token,
        acceptInput(mobile),
      );
      assert.equal(result.status, 'APPROVED');
      assert.equal(result.familyId, headFamilyId);

      const rows = await pool.query(
        `SELECT m.is_head, m.status, m.family_id FROM members m
         JOIN accounts a ON a.member_id = m.id WHERE a.mobile = $1`,
        [mobile],
      );
      assert.equal(rows.rowCount, 1);
      assert.equal(rows.rows[0].is_head, false);
      assert.equal(rows.rows[0].status, 'APPROVED');
      assert.equal(rows.rows[0].family_id, headFamilyId);
    } finally {
      await pool.query(`DELETE FROM family_invitations WHERE id = $1`, [
        invitation.id,
      ]);
      await cleanupMobile(mobile);
    }
  });

  it('14b. a REGISTRATION proof cannot accept an invitation', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    const invitation = await invite(mobile);
    try {
      await seedPendingOtp(mobile, 'REGISTRATION');
      await verifyTestOtp(mobile);
      await rejectsWith(
        () => FamilyService.acceptInvitation(invitation.token, acceptInput(mobile)),
        401,
      );
      assert.equal(await memberCountFor(mobile), 0);
    } finally {
      await pool.query(`DELETE FROM family_invitations WHERE id = $1`, [
        invitation.id,
      ]);
      await cleanupMobile(mobile);
    }
  });

  it('17a. invitation bound to another mobile is rejected', async () => {
    const mobileA = testMobile();
    const mobileB = testMobile();
    await cleanupMobile(mobileA);
    await cleanupMobile(mobileB);
    const invitation = await invite(mobileA);
    try {
      await seedPendingOtp(mobileB, 'INVITATION');
      await verifyTestOtp(mobileB);
      await rejectsWith(
        () => FamilyService.acceptInvitation(invitation.token, acceptInput(mobileB)),
        403,
      );
    } finally {
      await pool.query(`DELETE FROM family_invitations WHERE id = $1`, [
        invitation.id,
      ]);
      await cleanupMobile(mobileA);
      await cleanupMobile(mobileB);
    }
  });

  it('17b. already-registered mobile is sent to login', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    const invitation = await invite(mobile);
    try {
      // Mobile already belongs to the head household itself.
      const headMobile = (globalThis as { __headMobile?: string }).__headMobile as string;
      const clash = await invite(headMobile);
      await seedPendingOtp(headMobile, 'INVITATION');
      await verifyTestOtp(headMobile);
      await rejectsWith(
        () =>
          FamilyService.acceptInvitation(
            clash.token,
            acceptInput(headMobile),
          ),
        409,
      );
      await pool.query(`DELETE FROM family_invitations WHERE id = $1`, [clash.id]);
    } finally {
      await pool.query(`DELETE FROM family_invitations WHERE id = $1`, [
        invitation.id,
      ]);
      await cleanupMobile(mobile);
    }
  });

  it('18. concurrent acceptance: exactly one wins, no partial members', async () => {
    const mobile = testMobile();
    await cleanupMobile(mobile);
    const invitation = await invite(mobile);
    try {
      // Single-slot proofs: one verification yields exactly one claimable
      // proof, so at most one accept proceeds. The loser is rejected safely
      // either at the atomic proof claim (401, arriving mid-race) or at the
      // invitation-status check (409, arriving after the commit); a later
      // retry on the accepted invitation deterministically reports 409.
      await seedPendingOtp(mobile, 'INVITATION');
      await verifyTestOtp(mobile);

      const outcomes = await Promise.allSettled([
        FamilyService.acceptInvitation(invitation.token, acceptInput(mobile)),
        FamilyService.acceptInvitation(invitation.token, acceptInput(mobile)),
      ]);
      const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
      const rejected = outcomes.filter((o) => o.status === 'rejected');
      assert.equal(fulfilled.length, 1);
      assert.equal(rejected.length, 1);
      const reason = (rejected[0] as PromiseRejectedResult).reason;
      assert.ok(reason instanceof AppError);
      assert.ok(
        (reason as AppError).statusCode === 401 ||
          (reason as AppError).statusCode === 409,
      );

      assert.equal(await memberCountFor(mobile), 1);
      const status = await pool.query(
        `SELECT status FROM family_invitations WHERE id = $1`,
        [invitation.id],
      );
      assert.equal(status.rows[0].status, 'ACCEPTED');

      await rejectsWith(
        () => FamilyService.acceptInvitation(invitation.token, acceptInput(mobile)),
        409,
      );
    } finally {
      await pool.query(`DELETE FROM family_invitations WHERE id = $1`, [
        invitation.id,
      ]);
      await cleanupMobile(mobile);
    }
  });
});
