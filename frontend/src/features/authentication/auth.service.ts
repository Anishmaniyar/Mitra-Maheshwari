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
  OtpPurpose,
  ProfilePatch,
  SendOtpResponse,
  VerifyOtpResponse,
} from "../../types/api";

interface BackendMemberProfile {
  id: string;
  familyId: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  mobile: string;
  bloodGroup: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
  role: string;
  isHead: boolean;
  status: string;
}

/** Backend MemberProfile → frontend Member (PAN is never returned by the API). */
export function toMember(profile: BackendMemberProfile): Member {
  return {
    id: profile.id,
    firstName: profile.firstName,
    middleName: profile.middleName,
    lastName: profile.lastName ?? "",
    mobile: profile.mobile,
    bloodGroup: profile.bloodGroup,
    age: profile.age,
    occupation: profile.occupation,
    area: profile.area,
    panName: null,
    panNumber: null,
    isActiveMember: profile.status === "APPROVED",
    familyId: profile.familyId,
    isHead: profile.isHead,
    role: profile.role,
  };
}

export function sendOtp(input: {
  memberId: string;
  mobile: string;
  purpose?: OtpPurpose;
}): Promise<SendOtpResponse> {
  if (DEMO_MODE) return demoSendOtp(input);
  return api<{ expiresAt: string }>("/auth/request-otp", {
    method: "POST",
    body: { mobile: input.mobile, ...(input.purpose ? { purpose: input.purpose } : {}) },
    auth: false,
  }).then((data) => ({
    expiresInSeconds: Math.max(
      0,
      Math.round((new Date(data.expiresAt).getTime() - Date.now()) / 1000),
    ),
  }));
}

export function resendOtp(input: {
  memberId: string;
  mobile: string;
  purpose?: OtpPurpose;
}): Promise<SendOtpResponse> {
  if (DEMO_MODE) return demoResendOtp(input);
  return sendOtp(input);
}

interface BackendVerifyOtp {
  verified: boolean;
  accountStatus: VerifyOtpResponse["accountStatus"];
  nextAction: VerifyOtpResponse["nextAction"];
  accessToken?: string;
  member?: BackendMemberProfile;
}

export function verifyOtp(input: {
  memberId: string;
  mobile: string;
  otp: string;
}): Promise<VerifyOtpResponse> {
  if (DEMO_MODE) return demoVerifyOtp(input);
  return api<BackendVerifyOtp>(
    "/auth/verify-otp",
    { method: "POST", body: { mobile: input.mobile, code: input.otp }, auth: false },
  ).then((data) => ({
    verified: data.verified,
    accountStatus: data.accountStatus,
    nextAction: data.nextAction,
    token: data.accessToken ?? null,
    member: data.member ? toMember(data.member) : null,
  }));
}

/**
 * Development-only admin shortcut (local `vite dev` only — stripped from
 * production builds). Calls the backend dev endpoint, which issues a real
 * short-lived ADMIN JWT; no token is hardcoded in the frontend.
 */
export function devAdminLogin(): Promise<VerifyOtpResponse> {
  if (!import.meta.env.DEV) {
    return Promise.reject(new Error("Development login is not available."));
  }
  return api<{ accessToken: string; member: BackendMemberProfile }>(
    "/auth/dev-admin-login",
    { method: "POST", auth: false },
  ).then((data) => ({
    verified: true as const,
    accountStatus: "APPROVED" as const,
    nextAction: "LOGGED_IN" as const,
    token: data.accessToken,
    member: toMember(data.member),
  }));
}

export function getMe(): Promise<{ member: Member }> {
  if (DEMO_MODE) return demoGetMe();
  return api<BackendMemberProfile>("/auth/me").then((member) => ({
    member: toMember(member),
  }));
}

export function updateMe(
  memberId: string,
  patch: ProfilePatch,
): Promise<{ member: Member }> {
  if (DEMO_MODE) return demoUpdateMe(patch);
  return api<unknown>(`/family/members/${memberId}`, {
    method: "PATCH",
    body: patch,
  }).then(() => getMe());
}

export function logout(): Promise<void> {
  if (DEMO_MODE) return Promise.resolve();
  return api<null>("/auth/logout", { method: "POST" }).then(
    () => undefined,
    () => undefined,
  );
}
