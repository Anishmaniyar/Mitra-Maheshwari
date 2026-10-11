import { pool } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../../shared/auth/jwt.js';
import { consoleOtpDelivery } from '../../shared/auth/otpDelivery.js';
import {
  requestChallenge,
  verifyChallenge,
} from './otpChallenge.store.js';
import * as AuthRepository from './auth.repository.js';
import type { RequestOtpInput, VerifyOtpInput } from './auth.schema.js';

export interface IssuedAuth {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  member: AuthRepository.MemberProfile;
}

// Explicit verify-otp outcome. OTP verification proves control of a mobile
// number only — it never implicitly signals the next step via HTTP status.
// Tokens are present exclusively when nextAction is LOGGED_IN (approved).
export type AccountStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type NextAction =
  | 'COMPLETE_REGISTRATION'
  | 'AWAITING_APPROVAL'
  | 'LOGGED_IN'
  | 'CONTACT_SUPPORT';

export interface VerifiedOtp {
  verified: true;
  accountStatus: AccountStatus;
  nextAction: NextAction;
  accessToken?: string;
  refreshToken?: string;
  refreshExpiresAt?: Date;
  member?: AuthRepository.MemberProfile;
}

export const parseDurationToMs = (value: string): number => {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new AppError('Invalid token lifetime configuration', 500);
  }
  const amount = Number(match[1]);
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (unitMs[match[2]] ?? 0);
};

export const getRefreshCookieMaxAgeMs = (): number =>
  parseDurationToMs(env.REFRESH_TOKEN_EXPIRES_IN);

export const requestOtp = async (
  input: RequestOtpInput,
): Promise<{ expiresAt: Date }> => {
  // Purpose defaults to LOGIN when the caller omits it (same effective
  // behavior as before: an unpurposed challenge can never satisfy a
  // REGISTRATION/INVITATION proof). Challenge state, cooldowns, and resend
  // caps live in Redis; delivery is a separate adapter (console in
  // non-production, SMS provider later) and never touches verification.
  const purpose = input.purpose ?? 'LOGIN';
  const { code, expiresAt } = await requestChallenge(input.mobile, purpose);

  await consoleOtpDelivery.sendOtp({
    mobile: input.mobile.trim(),
    code,
    purpose,
    expiresAt,
  });

  return { expiresAt };
};

export const verifyOtp = async (input: VerifyOtpInput): Promise<VerifiedOtp> => {
  // The challenge's bound purpose is authoritative. An explicitly supplied
  // purpose must match it (else 401); otherwise the latest challenge for
  // the mobile is consumed and its purpose drives the rules below.
  // A session is issued only for a LOGIN challenge on an approved account:
  // REGISTRATION/INVITATION challenges prove mobile control for their own
  // flows (via the single-use Redis proof) and can never mint a session.
  const { purpose } = await verifyChallenge(
    input.mobile,
    input.code,
    input.purpose,
  );

  // Verification succeeded: branch explicitly on account state. Tokens are
  // present exclusively when nextAction is LOGGED_IN (approved + LOGIN).
  const identity = await AuthRepository.findAuthIdentityByMobile(
    input.mobile.trim(),
  );
  if (!identity) {
    return {
      verified: true,
      accountStatus: 'NONE',
      nextAction: 'COMPLETE_REGISTRATION',
    };
  }
  if (identity.status === 'PENDING') {
    return {
      verified: true,
      accountStatus: 'PENDING',
      nextAction: 'AWAITING_APPROVAL',
    };
  }
  if (identity.status !== 'APPROVED' || purpose !== 'LOGIN') {
    return {
      verified: true,
      accountStatus: identity.status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      nextAction: 'CONTACT_SUPPORT',
    };
  }

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
      verified: true,
      accountStatus: 'APPROVED',
      nextAction: 'LOGGED_IN',
      accessToken: generateAccessToken({
        memberId: identity.memberId,
        role: identity.role,
        familyId: identity.familyId,
        isFamilyHead: identity.isHead,
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

export const refreshSession = async (
  presentedToken: string,
): Promise<IssuedAuth> => {
  const stored = await AuthRepository.findRefreshTokenByHash(
    hashRefreshToken(presentedToken),
  );

  if (!stored) {
    throw new AppError('Invalid refresh token', 401);
  }
  if (stored.revokedAt) {
    if (stored.replacedByTokenId) {
      await AuthRepository.revokeActiveRefreshTokensForMember(stored.memberId);
    }
    throw new AppError('Invalid refresh token', 401);
  }
  if (stored.expiresAt.getTime() <= Date.now()) {
    throw new AppError('Refresh token expired', 401);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const profile = await AuthRepository.findMemberProfileById(stored.memberId);
    if (!profile) {
      throw new AppError('Account not found', 404);
    }
    if (profile.status !== 'APPROVED') {
      throw new AppError('Account is not approved', 403);
    }

    const { token, tokenHash } = generateRefreshToken();
    const refreshExpiresAt = new Date(
      Date.now() + parseDurationToMs(env.REFRESH_TOKEN_EXPIRES_IN),
    );
    const created = await AuthRepository.createRefreshToken(
      { memberId: stored.memberId, tokenHash, expiresAt: refreshExpiresAt },
      client,
    );
    await AuthRepository.revokeRefreshToken(stored.id, created.id, client);
    await client.query('COMMIT');

    const identity = await AuthRepository.findAuthIdentityByMobile(profile.mobile);
    if (!identity) {
      throw new AppError('Account not found', 404);
    }

    return {
      accessToken: generateAccessToken({
        memberId: identity.memberId,
        role: identity.role,
        familyId: identity.familyId,
        isFamilyHead: identity.isHead,
      }),
      refreshToken: token,
      refreshExpiresAt,
      member: profile,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const logout = async (presentedToken?: string): Promise<void> => {
  if (!presentedToken) {
    return;
  }
  const stored = await AuthRepository.findRefreshTokenByHash(
    hashRefreshToken(presentedToken),
  );
  if (stored && !stored.revokedAt) {
    await AuthRepository.revokeRefreshToken(stored.id, null);
  }
};

export const getMe = async (
  memberId: string,
): Promise<AuthRepository.MemberProfile> => {
  const member = await AuthRepository.findMemberProfileById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }
  return member;
};
