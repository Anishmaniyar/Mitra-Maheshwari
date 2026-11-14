import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';

// Shared-link admin access. There are no admin accounts or passwords: the
// link's secret (configured in ADMIN_ACCESS_SECRET) is exchanged for a signed,
// HttpOnly admin-session cookie. Session signing derives from the configured
// secret, so rotating the secret revokes every outstanding admin session while
// leaving normal member authentication untouched.

export const ADMIN_SESSION_COOKIE = 'mm_admin_session';

const ADMIN_TOKEN_ISSUER = 'mitra-maheshwari-admin';
const ADMIN_TOKEN_AUDIENCE = 'mitra-maheshwari-admin-panel';
const SESSION_KEY_CONTEXT = 'mm-admin-session-v1';

const sha256 = (value: string): Buffer =>
  crypto.createHash('sha256').update(value, 'utf8').digest();

export const isAdminLinkConfigured = (): boolean =>
  env.ADMIN_ACCESS_SECRET.trim().length > 0;

export const parseDurationToMs = (value: string): number => {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new AppError('Invalid admin session lifetime configuration', 500);
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

export const getAdminSessionMaxAgeMs = (): number =>
  parseDurationToMs(env.ADMIN_SESSION_EXPIRES_IN);

// Constant-time comparison over fixed-length digests. Both sides are hashed
// first so length differences cannot short-circuit timingSafeEqual.
export const verifyAdminAccessSecret = (candidate: string): boolean => {
  const configured = env.ADMIN_ACCESS_SECRET.trim();
  if (!configured || typeof candidate !== 'string' || candidate.length === 0) {
    return false;
  }
  return crypto.timingSafeEqual(sha256(candidate), sha256(configured));
};

const sessionSigningKey = (): Buffer =>
  crypto
    .createHmac('sha256', env.ADMIN_ACCESS_SECRET.trim())
    .update(SESSION_KEY_CONTEXT)
    .digest();

export const issueAdminSessionToken = (): string =>
  jwt.sign({ typ: 'admin' }, sessionSigningKey(), {
    algorithm: 'HS256',
    expiresIn: env.ADMIN_SESSION_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: ADMIN_TOKEN_ISSUER,
    audience: ADMIN_TOKEN_AUDIENCE,
  });

export const verifyAdminSessionToken = (
  token: string | null | undefined,
): boolean => {
  if (!isAdminLinkConfigured() || !token) {
    return false;
  }
  try {
    const payload = jwt.verify(token, sessionSigningKey(), {
      algorithms: ['HS256'],
      issuer: ADMIN_TOKEN_ISSUER,
      audience: ADMIN_TOKEN_AUDIENCE,
    }) as jwt.JwtPayload;
    return payload.typ === 'admin';
  } catch {
    return false;
  }
};

/** Exchanges a link secret for a signed admin-session token. */
export const exchangeAdminLink = (secret: string): string => {
  if (!isAdminLinkConfigured()) {
    throw new AppError('Admin access is not configured', 503);
  }
  if (!verifyAdminAccessSecret(secret)) {
    throw new AppError('Invalid admin access link', 401);
  }
  return issueAdminSessionToken();
};
