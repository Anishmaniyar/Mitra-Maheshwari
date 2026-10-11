import crypto from 'node:crypto';
import { pool } from '../config/database.js';
import {
  deleteOtpStateForMobile,
  seedChallengeForTest,
} from '../modules/auth/otpChallenge.store.js';
import * as AuthRepository from '../modules/auth/auth.repository.js';
import * as AuthService from '../modules/auth/auth.service.js';
import * as RegistrationService from '../modules/registration/registration.service.js';
import * as AdminService from '../modules/admin/admin.service.js';
import { ensureTestRedis } from './redis-test.js';

// Shared helpers for DB-backed flow tests. Every helper takes an explicit
// mobile; tests own cleanup via cleanupMobile (pre-clean for crash leftovers,
// post-clean in finally). Test mobiles live in the 9000001xxx range, clear
// of the dev-admin identity (9000000001).

/**
 * Test mobiles are random per call (not sequential): node --test runs files
 * in parallel processes, so per-file counters collide across files and one
 * file's cleanup can delete another file's rows mid-test. Random 10-digit
 * numbers starting with 9 make collisions practically impossible; every
 * test still pre-cleans and post-cleans its own numbers.
 */
export const testMobile = (): string =>
  `9${String(100000000 + Math.floor(Math.random() * 899999999))}`;

export const TEST_OTP = '123456';

export const cleanupMobile = async (mobile: string): Promise<void> => {
  const members = await pool.query(
    `SELECT m.id AS id, m.family_id AS family_id
     FROM members m
     LEFT JOIN accounts a ON a.member_id = m.id
     WHERE a.mobile = $1 OR m.mobile = $1`,
    [mobile],
  );
  const memberIds: string[] = [
    ...new Set(members.rows.map((r) => r.id as string)),
  ];
  const familyIds: string[] = [
    ...new Set(members.rows.map((r) => r.family_id as string)),
  ];
  if (memberIds.length > 0) {
    await pool.query(`DELETE FROM refresh_tokens WHERE member_id = ANY($1)`, [
      memberIds,
    ]);
    await pool.query(`DELETE FROM accounts WHERE member_id = ANY($1)`, [
      memberIds,
    ]);
    await pool.query(`DELETE FROM members WHERE id = ANY($1)`, [memberIds]);
  }
  if (familyIds.length > 0) {
    // Only remove families left without members (e.g. the invitee's own
    // household). A shared household that still has members — like the test
    // head's family — is left intact (RESTRICT would reject it anyway).
    const deletedFamilies = await pool.query(
      `DELETE FROM families
       WHERE id = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM members m WHERE m.family_id = families.id)
       RETURNING id`,
      [familyIds],
    );
    const deletedIds: string[] = deletedFamilies.rows.map((r) => r.id as string);
    if (deletedIds.length > 0) {
      await pool.query(
        `DELETE FROM family_invitations WHERE family_id = ANY($1)`,
        [deletedIds],
      );
    }
  }
  await pool.query(`DELETE FROM otps WHERE mobile = $1`, [mobile]);
  // Redis challenge/proof/cooldown/resend state for the same mobile.
  await ensureTestRedis();
  await deleteOtpStateForMobile(mobile);
};

/** Seeds a Redis OTP challenge directly (known code; skips resend cooldowns). */
export const seedPendingOtp = async (
  mobile: string,
  purpose: string,
  code = TEST_OTP,
  expiresInMinutes = 5,
): Promise<void> => {
  await ensureTestRedis();
  if (expiresInMinutes <= 0) {
    // Simulate an expired challenge: no challenge key exists to verify.
    await deleteOtpStateForMobile(mobile);
    return;
  }
  await seedChallengeForTest(
    mobile,
    purpose,
    code,
    Math.max(1, Math.round(expiresInMinutes * 60)),
  );
};

/** Full real path: pending row must already exist (seedPendingOtp). */
export const verifyTestOtp = (mobile: string, code = TEST_OTP) =>
  AuthService.verifyOtp({ mobile, code });

export const registrationInput = (mobile: string) => ({
  mobile,
  firstName: 'Test',
  middleName: 'K',
  lastName: `User${mobile.slice(-4)}`,
  age: 30,
});

export const completeTestRegistration = (mobile: string) =>
  RegistrationService.completeRegistration(registrationInput(mobile));

export const seedAdmin = async (mobile: string): Promise<string> => {
  await cleanupMobile(mobile);
  const familyCode = `TEST-ADMIN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const family = await pool.query(
    `INSERT INTO families (family_code, status) VALUES ($1, 'ACTIVE') RETURNING id`,
    [familyCode],
  );
  const member = await pool.query(
    `INSERT INTO members (family_id, first_name, last_name, mobile, is_head, status)
     VALUES ($1, 'Test', 'Admin', $2, TRUE, 'APPROVED') RETURNING id`,
    [family.rows[0].id, mobile],
  );
  await pool.query(
    `INSERT INTO accounts (member_id, mobile, role) VALUES ($1, $2, 'ADMIN')`,
    [member.rows[0].id, mobile],
  );
  return member.rows[0].id as string;
};

/** Registers a family head and approves them: returns usable head identity. */
export const registerApprovedHead = async (
  mobile: string,
  adminMemberId: string,
): Promise<{ memberId: string; familyId: string }> => {
  await cleanupMobile(mobile);
  await seedPendingOtp(mobile, 'REGISTRATION');
  await verifyTestOtp(mobile);
  const reg = await completeTestRegistration(mobile);
  await AdminService.approveRegistration(reg.familyId, adminMemberId);
  const profile = await AuthRepository.findAuthIdentityByMobile(mobile);
  if (!profile) throw new Error('setup failed: approved head not found');
  return { memberId: profile.memberId, familyId: profile.familyId };
};

export const countRecordsForMobile = async (
  mobile: string,
): Promise<{ families: number; members: number; accounts: number }> => {
  const families = await pool.query(
    `SELECT COUNT(*)::int AS n FROM families f
     WHERE EXISTS (
       SELECT 1 FROM members m LEFT JOIN accounts a ON a.member_id = m.id
       WHERE m.family_id = f.id AND (a.mobile = $1 OR m.mobile = $1)
     )`,
    [mobile],
  );
  const members = await pool.query(
    `SELECT COUNT(*)::int AS n FROM members m
     LEFT JOIN accounts a ON a.member_id = m.id
     WHERE a.mobile = $1 OR m.mobile = $1`,
    [mobile],
  );
  const accounts = await pool.query(
    `SELECT COUNT(*)::int AS n FROM accounts WHERE mobile = $1`,
    [mobile],
  );
  return {
    families: families.rows[0].n as number,
    members: members.rows[0].n as number,
    accounts: accounts.rows[0].n as number,
  };
};

export const closeTestPool = async (): Promise<void> => {
  await pool.end();
};
