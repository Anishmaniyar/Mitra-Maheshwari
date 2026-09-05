import { createHash, randomInt } from "node:crypto";

export const OTP_LENGTH = 6;

/** Generates a cryptographically secure 6-digit OTP. */
export function generateOtp(): string {
  return randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH).toString();
}

/** SHA-256 hash of an OTP (only the hash is stored). */
export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}