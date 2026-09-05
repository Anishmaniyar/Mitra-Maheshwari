import { z } from "zod";

export const sendOtpSchema = z.object({
  memberId: z.number().int().positive(),
  mobile: z.string().trim().min(10, "Enter a valid mobile number").max(15),
});

export const verifyOtpSchema = z.object({
  memberId: z.number().int().positive(),
  mobile: z.string().trim().min(10, "Enter a valid mobile number").max(15),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;