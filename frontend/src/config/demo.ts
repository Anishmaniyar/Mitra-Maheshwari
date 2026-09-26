// DEVELOPMENT ONLY — DEMO / PREVIEW MODE
// =======================================
// This file simulates the backend responses needed to visually test the full
// frontend flow without PostgreSQL, member data, an SMS provider, real OTP,
// JWT, family APIs, or Razorpay.
//
// REMOVE BEFORE PRODUCTION AUTHENTICATION IS ENABLED
//
// Demo mode activates ONLY when BOTH hold:
//   1. The app is served by the Vite development server (NODE_ENV=development),
//      i.e. import.meta.env.DEV is true.
//   2. VITE_DEMO_MODE=true is set in the frontend environment.
//
// Production builds (vite build / import.meta.env.DEV === false) NEVER enable
// demo mode — even if VITE_DEMO_MODE=true is set, DEMO_MODE stays false.
// The demo test OTP (123456) therefore can never be accepted in production.

import { ApiError } from "../services/api";
import type {
  CreateMemberResponse,
  Family,
  FamilyMember,
  MatchResponse,
  Member,
  NewMemberInput,
  Payment,
  ProfilePatch,
  SendOtpResponse,
  VerifyOtpResponse,
} from "../types/api";
import { maskMobile } from "../utils/format";

/** True only on the Vite dev server with VITE_DEMO_MODE=true. Never in production. */
export const DEMO_MODE: boolean = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === "true";

/** Test OTP accepted in demo mode only. Hard-coded here — never in production code paths. */
export const DEMO_TEST_OTP = "123456";

/** Fake token that only demo services accept (getMe ignores it and returns the demo member). */
const DEMO_TOKEN = "demo-token";

const DEMO_MEMBERSHIP_AMOUNT = 500;
const DEMO_MEMBERSHIP_CURRENCY = "INR";

// ---------------------------------------------------------------------------
// Demo member (clearly fake development data — not a real community member)
// ---------------------------------------------------------------------------

export const DEMO_MEMBER: Member = {
  id: "9000001",
  firstName: "Demo",
  middleName: "Community",
  lastName: "Member",
  mobile: "9999999999",
  bloodGroup: "B+",
  age: 30,
  occupation: "Software Engineer",
  area: "Pune",
  panName: "DEMO COMMUNITY MEMBER",
  panNumber: "ABCDE1234F",
  isActiveMember: true,
  familyId: "9000001",
  isHead: true,
  role: "MEMBER",
};

// ---------------------------------------------------------------------------
// Demo family (fake development data)
// ---------------------------------------------------------------------------

function demoFamilyMember(input: {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  isHead: boolean;
  age: number | null;
  occupation: string | null;
  area: string | null;
  bloodGroup: string | null;
  mobile: string;
}): FamilyMember {
  return {
    ...input,
    isActiveMember: true,
    mobileMasked: maskMobile(input.mobile),
  };
}

const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  demoFamilyMember({
    id: "9000001",
    firstName: "Demo",
    middleName: "Community",
    lastName: "Member",
    isHead: true,
    age: 30,
    occupation: "Software Engineer",
    area: "Pune",
    bloodGroup: "B+",
    mobile: DEMO_MEMBER.mobile,
  }),
  demoFamilyMember({
    id: "9000002",
    firstName: "Demo",
    middleName: "",
    lastName: "Member Two",
    isHead: false,
    age: 28,
    occupation: "Teacher",
    area: "Pune",
    bloodGroup: "O+",
    mobile: "9888888888",
  }),
  demoFamilyMember({
    id: "9000003",
    firstName: "Demo",
    middleName: "",
    lastName: "Member Three",
    isHead: false,
    age: 25,
    occupation: "Student",
    area: "Pune",
    bloodGroup: "A+",
    mobile: "9777777777",
  }),
];

// Mutable so "Add family member" works within a demo session. Resets on reload.
let demoFamily: Family = {
  familyId: "9000001",
  head: DEMO_MEMBER,
  members: DEMO_FAMILY_MEMBERS,
  membership: {
    status: "pending",
    year: new Date().getFullYear(),
    amount: DEMO_MEMBERSHIP_AMOUNT,
    currency: DEMO_MEMBERSHIP_CURRENCY,
  },
};

// ---------------------------------------------------------------------------
// Demo payments (fake development data — not real payments)
// ---------------------------------------------------------------------------

let demoPayments: Payment[] = [
  {
    id: "9000003",
    familyId: "9000001",
    year: new Date().getFullYear(),
    amount: DEMO_MEMBERSHIP_AMOUNT,
    currency: DEMO_MEMBERSHIP_CURRENCY,
    transactionMode: "Pending",
    transactionId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9000002",
    familyId: "9000001",
    year: new Date().getFullYear() - 1,
    amount: DEMO_MEMBERSHIP_AMOUNT,
    currency: DEMO_MEMBERSHIP_CURRENCY,
    transactionMode: "UPI",
    transactionId: "DEMO-TXN-0002",
    status: "paid",
    createdAt: new Date(Date.UTC(new Date().getFullYear() - 1, 3, 12, 10, 0, 0)).toISOString(),
    updatedAt: new Date(Date.UTC(new Date().getFullYear() - 1, 3, 12, 10, 5, 0)).toISOString(),
  },
  {
    id: "9000001",
    familyId: "9000001",
    year: new Date().getFullYear() - 2,
    amount: DEMO_MEMBERSHIP_AMOUNT,
    currency: DEMO_MEMBERSHIP_CURRENCY,
    transactionMode: "UPI",
    transactionId: "DEMO-TXN-0001",
    status: "paid",
    createdAt: new Date(Date.UTC(new Date().getFullYear() - 2, 3, 15, 10, 0, 0)).toISOString(),
    updatedAt: new Date(Date.UTC(new Date().getFullYear() - 2, 3, 15, 10, 5, 0)).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Demo services — simulate the real API responses without a backend
// ---------------------------------------------------------------------------

export async function demoMatchMember(_input: { firstName: string; lastName: string; mobile: string }): Promise<MatchResponse> {
  // Always "find" the demo member so the flow skips real member matching.
  return { status: "EXISTING_MEMBER_FOUND", member: DEMO_MEMBER, candidates: [] };
}

export async function demoCreateMember(_input: NewMemberInput): Promise<CreateMemberResponse> {
  return { member: DEMO_MEMBER };
}

export async function demoSendOtp(_input: { memberId: string; mobile: string }): Promise<SendOtpResponse> {
  return { expiresInSeconds: 300 };
}

export async function demoResendOtp(_input: { memberId: string; mobile: string }): Promise<SendOtpResponse> {
  return { expiresInSeconds: 300 };
}

export async function demoVerifyOtp(input: { memberId: string; mobile: string; otp: string }): Promise<VerifyOtpResponse> {
  if (input.otp !== DEMO_TEST_OTP) {
    throw new ApiError(400, "INVALID_OTP", "The code you entered is incorrect. In demo mode, use 123456.");
  }
  return { token: DEMO_TOKEN, member: DEMO_MEMBER };
}

export async function demoGetMe(): Promise<{ member: Member }> {
  return { member: DEMO_MEMBER };
}

export async function demoUpdateMe(patch: ProfilePatch): Promise<{ member: Member }> {
  return { member: { ...DEMO_MEMBER, ...patch } };
}

export async function demoGetFamily(): Promise<{ family: Family }> {
  return { family: demoFamily };
}

export async function demoAddFamilyMember(input: NewMemberInput): Promise<{ family: Family }> {
  const member: FamilyMember = {
    id: `demo-member-${demoFamily.members.length + 1}`,
    firstName: input.firstName,
    middleName: input.middleName ?? null,
    lastName: input.lastName,
    isHead: false,
    age: input.age ?? null,
    occupation: input.occupation ?? null,
    area: input.area ?? null,
    bloodGroup: input.bloodGroup ?? null,
    isActiveMember: true,
    mobileMasked: maskMobile(input.mobile),
  };
  demoFamily = { ...demoFamily, members: [...demoFamily.members, member] };
  return { family: demoFamily };
}

export async function demoGetPayments(): Promise<{ payments: Payment[] }> {
  return { payments: demoPayments };
}

export async function demoCreatePayment(): Promise<{ payment: Payment }> {
  const year = new Date().getFullYear();
  const existing = demoPayments.find((p) => p.year === year && p.status === "pending");
  if (existing) return { payment: existing };

  const payment: Payment = {
    id: `demo-payment-${demoPayments.length + 1}`,
    familyId: "9000001",
    year,
    amount: DEMO_MEMBERSHIP_AMOUNT,
    currency: DEMO_MEMBERSHIP_CURRENCY,
    transactionMode: "Pending",
    transactionId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoPayments = [payment, ...demoPayments];
  return { payment };
}