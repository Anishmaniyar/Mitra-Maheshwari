import { env } from "../../config/env";
import { generateOtp, hashOtp } from "../../utils/crypto";
import { AppError } from "../../utils/http";
import * as authRepository from "./auth.repository";
import { smsProvider } from "./sms.provider";

/**
 * Issues a fresh OTP for a mobile number, enforcing the resend cooldown and
 * resend limits. The code is hashed before storage and only ever reaches the
 * SmsProvider — it is never stored, logged, or returned in API responses.
 */
export async function sendOtp(input: { memberId: number; mobile: string }): Promise<{ expiresInSeconds: number }> {
  const now = Date.now();
  const existing = await authRepository.findLatestActiveOtp(input.mobile);
  if (existing) {
    const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
    const elapsed = now - existing.last_sent_at.getTime();
    if (elapsed < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      throw new AppError(429, "OTP_RESEND_COOLDOWN", `Please wait ${waitSeconds}s before requesting another OTP.`);
    }
    if (existing.resend_count >= env.OTP_MAX_RESENDS) {
      throw new AppError(429, "OTP_RESEND_LIMIT", "Too many OTP requests. Please try again later.");
    }
  }

  const code = generateOtp();
  const expiresAt = new Date(now + env.OTP_TTL_MINUTES * 60_000);
  const resendCount = existing ? existing.resend_count + 1 : 0;

  await authRepository.deleteActiveOtpsForMobile(input.mobile);
  await authRepository.createOtp({
    memberId: input.memberId,
    mobile: input.mobile,
    codeHash: hashOtp(code),
    expiresAt,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    resendCount,
  });

  await smsProvider.send(input.mobile, code);

  return { expiresInSeconds: env.OTP_TTL_MINUTES * 60 };
}

/**
 * Verifies the OTP with expiry and attempt-limit enforcement. On success the
 * OTP is consumed (single use) and the member's id is returned.
 */
export async function verifyOtp(input: {
  memberId: number;
  mobile: string;
  otp: string;
}): Promise<{ memberId: number }> {
  const otpRow = await authRepository.findLatestActiveOtp(input.mobile);
  if (!otpRow) throw new AppError(400, "OTP_NOT_FOUND", "No active OTP found. Request a new one.");
  if (otpRow.expires_at.getTime() < Date.now()) {
    throw new AppError(400, "OTP_EXPIRED", "This OTP has expired. Request a new one.");
  }
  if (otpRow.attempts >= otpRow.max_attempts) {
    throw new AppError(429, "OTP_ATTEMPT_LIMIT", "Too many incorrect attempts. Request a new OTP.");
  }

  if (hashOtp(input.otp.trim()) !== otpRow.code_hash) {
    await authRepository.incrementOtpAttempts(otpRow.id);
    const remaining = otpRow.max_attempts - otpRow.attempts - 1;
    throw new AppError(
      400,
      "INVALID_OTP",
      remaining > 0 ? `Incorrect OTP. ${remaining} attempt(s) left.` : "Incorrect OTP. Request a new one.",
    );
  }

  await authRepository.consumeOtp(otpRow.id);
  return { memberId: otpRow.member_id };
}