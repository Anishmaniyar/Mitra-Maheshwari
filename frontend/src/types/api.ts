export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/* Domain types shared across the frontend.
   Field names follow the API's camelCase convention; the backend stores the
   snake_case member fields (first_name, last_name, ...) listed in the spec. */

/** A community member record (imported community data). */
export interface Member {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  mobile: string;
  bloodGroup: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
  panName: string | null;
  panNumber: string | null;
  isActiveMember: boolean;
  familyId: number;
  isHead: boolean;
}

/** The authenticated application user — a member who verified their mobile. */
export type AuthUser = Member;

/** Response of POST /api/members/match */
export type MatchStatus = "EXISTING_MEMBER_FOUND" | "NO_MEMBER_FOUND" | "MULTIPLE_MATCHES";

export interface MatchResponse {
  status: MatchStatus;
  member: Member | null;
  candidates: Member[];
}

export interface CreateMemberResponse {
  member: Member;
}

/** Editable profile fields (PATCH /api/me). */
export interface ProfilePatch {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  bloodGroup?: string | null;
  age?: number | null;
  occupation?: string | null;
  area?: string | null;
  panName?: string | null;
  panNumber?: string | null;
}

/** In-progress registration carried between /register/details and /register/verify. */
export interface RegistrationData {
  memberId: number;
  mobile: string;
  profile: ProfileFields;
}

/** Form-bound profile values (strings so inputs can be partially edited). */
export interface ProfileFields {
  firstName: string;
  middleName: string;
  lastName: string;
  age: string;
  bloodGroup: string;
  occupation: string;
  area: string;
  panName: string;
  panNumber: string;
}

export interface SendOtpResponse {
  expiresInSeconds: number;
}

export interface VerifyOtpResponse {
  token: string;
  member: Member;
}

export type MembershipStatus = "none" | "pending" | "paid" | "failed";

export interface Membership {
  status: MembershipStatus;
  year: number | null;
  amount: number | null;
  currency: string;
}

export interface FamilyMember {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  isHead: boolean;
  age: number | null;
  occupation: string | null;
  area: string | null;
  bloodGroup: string | null;
  isActiveMember: boolean;
  mobileMasked: string;
}

export interface Family {
  familyId: number;
  head: Member | null;
  members: FamilyMember[];
  membership: Membership;
}

export type PaymentStatus = "pending" | "paid" | "failed";

export interface Payment {
  id: number;
  familyId: number;
  year: number;
  amount: number;
  currency: string;
  transactionMode: string;
  transactionId: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a new member (registration) or adding a family member. */
export interface NewMemberInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  mobile: string;
  bloodGroup?: string | null;
  age?: number | null;
  occupation?: string | null;
  area?: string | null;
}