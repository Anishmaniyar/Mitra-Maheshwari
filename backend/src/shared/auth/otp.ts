import crypto from 'node:crypto';
import { env } from '../../config/env.js';

// OTP mechanics only: how OTPs are generated, hashed, and compared.
// Expiry, resend rules, attempt limits, and authentication decisions
// live in auth.service.ts.

export const generateOtp = (): string =>
  String(crypto.randomInt(100000, 1000000));

export const hashOtp = (code: string): string =>
  crypto.createHmac('sha256', env.JWT_SECRET).update(code).digest('hex');

export const verifyOtpHash = (code: string, expectedHash: string): boolean => {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hashOtp(code), 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  } catch {
    return false;
  }
};
