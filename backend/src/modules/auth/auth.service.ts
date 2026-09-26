import { pool } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../../shared/auth/jwt.js';
import { generateOtp, hashOtp, verifyOtpHash } from '../../shared/auth/otp.js';
import * as AuthRepository from './auth.repository.js';
import type { RequestOtpInput, VerifyOtpInput } from './auth.schema.js';

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_RESEND_COUNT = 5;

export interface IssuedAuth {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  member: AuthRepository.MemberProfile;
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
  const pending = await AuthRepository.findLatestPendingOtpByMobile(input.mobile);

  if (pending) {
    const secondsSinceLastSent =
      (Date.now() - pending.lastSentAt.getTime()) / 1000;
    if (secondsSinceLastSent < RESEND_COOLDOWN_SECONDS) {
      throw new AppError('Please wait before requesting another OTP', 429);
    }
    if (pending.resendCount >= MAX_RESEND_COUNT) {
      throw new AppError('Too many OTP requests. Please try again later', 429);
    }
  }

  // Real random OTP every time. Delivery is out of scope for now: in
  // non-production the code is logged to the backend terminal only
  // (never returned in the API response).
  const code = generateOtp();
  const identity = await AuthRepository.findAuthIdentityByMobile(input.mobile);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await AuthRepository.createOtp({
    memberId: identity?.memberId ?? null,
    mobile: input.mobile,
    codeHash: hashOtp(code),
    expiresAt,
    resendCount: pending ? pending.resendCount + 1 : 0,
  });

  if (env.NODE_ENV !== 'production') {
    console.log(`[OTP DEMO] OTP for mobile ending ${input.mobile.slice(-4)}: ${code}`);
  }

  return { expiresAt };
};

export const verifyOtp = async (input: VerifyOtpInput): Promise<IssuedAuth> => {
  const otp = await AuthRepository.findLatestPendingOtpByMobile(input.mobile);

  if (!otp || otp.expiresAt.getTime() <= Date.now()) {
    throw new AppError('Invalid or expired OTP', 401);
  }
  if (otp.attempts >= otp.maxAttempts) {
    throw new AppError('Invalid or expired OTP', 401);
  }
  if (!verifyOtpHash(input.code, otp.codeHash)) {
    await AuthRepository.incrementOtpAttempts(otp.id);
    throw new AppError('Invalid or expired OTP', 401);
  }

  // Consumed outside the transaction below so the single-use proof survives
  // even when no account exists yet (registration reads this proof later).
  // The conditional update also wins concurrent double-submits: only the
  // first request consumes the OTP.
  const consumed = await AuthRepository.consumeOtp(otp.id);
  if (!consumed) {
    throw new AppError('Invalid or expired OTP', 401);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const identity = await AuthRepository.findAuthIdentityByMobile(input.mobile);
    if (!identity) {
      throw new AppError('Account not found. Please complete registration', 404);
    }
    if (identity.status !== 'APPROVED') {
      throw new AppError('Account is not approved yet', 403);
    }

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
