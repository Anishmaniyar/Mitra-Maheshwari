import {
  DEMO_MODE,
  demoGetMe,
  demoResendOtp,
  demoSendOtp,
  demoUpdateMe,
  demoVerifyOtp,
} from "../../config/demo";
import { api } from "../../services/api";
import type {
  Member,
  ProfilePatch,
  SendOtpResponse,
  VerifyOtpResponse,
} from "../../types/api";

export function sendOtp(input: { memberId: number; mobile: string }): Promise<SendOtpResponse> {
  if (DEMO_MODE) return demoSendOtp(input);
  return api<SendOtpResponse>("/auth/send-otp", { method: "POST", body: input, auth: false });
}

export function resendOtp(input: { memberId: number; mobile: string }): Promise<SendOtpResponse> {
  if (DEMO_MODE) return demoResendOtp(input);
  return api<SendOtpResponse>("/auth/resend-otp", { method: "POST", body: input, auth: false });
}

export function verifyOtp(input: {
  memberId: number;
  mobile: string;
  otp: string;
}): Promise<VerifyOtpResponse> {
  if (DEMO_MODE) return demoVerifyOtp(input);
  return api<VerifyOtpResponse>("/auth/verify-otp", { method: "POST", body: input, auth: false });
}

export function getMe(): Promise<{ member: Member }> {
  if (DEMO_MODE) return demoGetMe();
  return api<{ member: Member }>("/me");
}

export function updateMe(patch: ProfilePatch): Promise<{ member: Member }> {
  if (DEMO_MODE) return demoUpdateMe(patch);
  return api<{ member: Member }>("/me", { method: "PATCH", body: patch });
}