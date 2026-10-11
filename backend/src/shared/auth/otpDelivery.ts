import { env } from '../../config/env.js';

// Delivery adapter boundary. OTP generation, hashing, storage, expiry,
// attempts, and consumption live in the Redis challenge store
// (modules/auth/otpChallenge.store.ts) and never depend on this module.
// Integrating a real SMS provider later means implementing OtpDelivery and
// wiring it in auth.service — verification and proof logic stay untouched.

export interface OtpDeliveryInput {
  mobile: string;
  code: string;
  purpose: string;
  expiresAt: Date;
}

export interface OtpDelivery {
  sendOtp(input: OtpDeliveryInput): Promise<void>;
}

// Current mechanism: development-only console delivery. The SMS provider is
// undecided, so nothing is sent in production yet — requestOtp still mints
// and stores the challenge (so the lifecycle is testable), but no code
// leaves the server. Never log the full mobile number alongside the code.
export const consoleOtpDelivery: OtpDelivery = {
  sendOtp: async (input: OtpDeliveryInput): Promise<void> => {
    if (env.NODE_ENV !== 'production') {
      console.log(
        `[OTP DEMO] OTP for mobile ending ${input.mobile.slice(-4)}: ${input.code}`,
      );
    }
  },
};

// Testable variant of the production gate: production never logs the code,
// regardless of delivery provider logging configuration.
export const isOtpLoggingAllowed = (nodeEnv: string): boolean =>
  nodeEnv !== 'production';
