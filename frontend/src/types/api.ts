export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/* Domain types shared across the frontend.
   Field names follow the API's camelCase convention; the backend stores the
   snake_case member fields (first_name, last_name, ...) listed in the spec.
   IDs are backend UUID strings throughout. */

/** Aggregate community counters from GET /api/stats (public, real data). */
export interface CommunityStats {
  families: number;
  members: number;
  bloodGroupsRecorded: number;
}

/** A community member record (imported community data). */
export interface Member {
  id: string;
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
  familyId: string;
  isHead: boolean;
  role: string;
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
  memberId: string;
  mobile: string;
  profile: ProfileFields;
  /** join: OTP-verified lookup → details → complete. login: draft-assisted login. */
  flow: "join" | "login";
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
  id: string;
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
  familyId: string;
  head: Member | null;
  members: FamilyMember[];
  membership: Membership;
}

export interface FamilyInvitation {
  id: string;
  inviteeName: string;
  inviteeMobile: string | null;
  inviteeEmail: string | null;
  status: string;
  expiresAt: string;
}

export type PaymentStatus = "pending" | "paid" | "failed";

export interface Payment {
  id: string;
  familyId: string;
  year: number;
  amount: number;
  currency: string;
  transactionMode: string;
  transactionId: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCheckout {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
}

export interface CreateOrderResponse {
  payment: Payment;
  checkout: PaymentCheckout;
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