import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { AccessTokenClaims, Role } from '../types/auth.types.js';

// Token mechanics only: how tokens are generated and verified.
// Business decisions (when to create, rotate, revoke) live in auth.service.ts.

export const generateAccessToken = (input: {
  memberId: string;
  role: Role;
  familyId: string;
  isFamilyHead: boolean;
}): string =>
  jwt.sign(
    {
      sub: input.memberId,
      role: input.role,
      familyId: input.familyId,
      isFamilyHead: input.isFamilyHead,
      jti: crypto.randomUUID(),
    },
    env.JWT_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

export const generateRefreshToken = (): { token: string; tokenHash: string } => {
  const token = crypto.randomBytes(48).toString('hex');
  return { token, tokenHash: hashRefreshToken(token) };
};

export const hashRefreshToken = (token: string): string =>
  crypto.createHmac('sha256', env.JWT_SECRET).update(token).digest('hex');

export const verifyAccessToken = (token: string): AccessTokenClaims =>
  jwt.verify(token, env.JWT_SECRET) as AccessTokenClaims;
