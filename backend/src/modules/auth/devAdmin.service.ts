import crypto from 'node:crypto';
import { pool } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../shared/auth/jwt.js';
import * as AuthRepository from './auth.repository.js';
import { parseDurationToMs } from './auth.service.js';
import type { IssuedAuth } from './auth.service.js';

// Development-only admin shortcut. Local testing convenience only:
// - Guarded by assertDevLoginAllowed(): hard error when NODE_ENV=production.
// - Issues a REAL short-lived JWT (existing generateAccessToken, default 15m)
//   with the ADMIN role, so the unchanged authenticate + authorize('ADMIN')
//   middleware protects /api/admin exactly as in production.
// - The dev identity is a real DB row (same shape as scripts/admin-seed.ts),
//   so session restore (/auth/me) and refresh rotation keep working.

export const DEV_ADMIN_MOBILE = '9000000001';

export const assertDevLoginAllowed = (): void => {
  if (env.NODE_ENV === 'production') {
    throw new AppError('Development login is not available', 403);
  }
};

const ensureDevAdminIdentity = async (): Promise<{
  memberId: string;
  accountId: string;
  familyId: string;
}> => {
  const existing = await AuthRepository.findAuthIdentityByMobile(DEV_ADMIN_MOBILE);
  if (existing) {
    if (existing.role !== 'ADMIN') {
      throw new AppError('Development admin identity has an unexpected role', 500);
    }
    return {
      memberId: existing.memberId,
      accountId: existing.accountId,
      familyId: existing.familyId,
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const familyCode = `DEV-ADMIN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const family = await client.query(
      `INSERT INTO families (family_code, status)
       VALUES ($1, 'ACTIVE') RETURNING id`,
      [familyCode],
    );
    const member = await client.query(
      `INSERT INTO members
         (family_id, first_name, last_name, mobile, is_head, status)
       VALUES ($1, 'Dev', 'Admin', $2, TRUE, 'APPROVED') RETURNING id`,
      [family.rows[0].id, DEV_ADMIN_MOBILE],
    );
    const account = await client.query(
      `INSERT INTO accounts (member_id, mobile, role)
       VALUES ($1, $2, 'ADMIN') RETURNING id`,
      [member.rows[0].id, DEV_ADMIN_MOBILE],
    );
    await client.query('COMMIT');
    return {
      memberId: member.rows[0].id as string,
      accountId: account.rows[0].id as string,
      familyId: family.rows[0].id as string,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const devAdminLogin = async (): Promise<IssuedAuth> => {
  assertDevLoginAllowed();

  const identity = await ensureDevAdminIdentity();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { token, tokenHash } = generateRefreshToken();
    const refreshExpiresAt = new Date(
      Date.now() + parseDurationToMs(env.REFRESH_TOKEN_EXPIRES_IN),
    );
    await AuthRepository.createRefreshToken(
      { memberId: identity.memberId, tokenHash, expiresAt: refreshExpiresAt },
      client,
    );
    await client.query('COMMIT');

    await AuthRepository.updateLastLoginAt(identity.accountId);

    const member = await AuthRepository.findMemberProfileById(identity.memberId);
    if (!member) {
      throw new AppError('Account not found', 404);
    }

    return {
      accessToken: generateAccessToken({
        memberId: identity.memberId,
        role: 'ADMIN',
        familyId: identity.familyId,
        isFamilyHead: true,
      }),
      refreshToken: token,
      refreshExpiresAt,
      member,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
