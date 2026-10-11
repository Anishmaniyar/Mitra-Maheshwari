import { z } from 'zod';

const mobileSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number');

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, 'Invalid OTP');

export const otpPurposeSchema = z.enum(['LOGIN', 'REGISTRATION', 'INVITATION']);

export const requestOtpSchema = z.object({
  mobile: mobileSchema,
  purpose: otpPurposeSchema.optional(),
});

export const verifyOtpSchema = z.object({
  mobile: mobileSchema,
  code: otpCodeSchema,
  // Optional and backward compatible: when supplied it must match the
  // requested challenge's purpose, else verification fails. Sessions are
  // issued only for LOGIN challenges regardless (see auth.service).
  purpose: otpPurposeSchema.optional(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;
