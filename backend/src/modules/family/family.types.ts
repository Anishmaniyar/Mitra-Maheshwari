import type { PublicMember } from "../members/member.types";

export type MembershipStatus = "none" | "pending" | "paid" | "failed";

export interface FamilyMemberSummary {
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

export interface MembershipInfo {
  status: MembershipStatus;
  year: number | null;
  amount: number | null;
  currency: string;
}

export interface FamilyResponse {
  familyId: number;
  head: PublicMember | null;
  members: FamilyMemberSummary[];
  membership: MembershipInfo;
}