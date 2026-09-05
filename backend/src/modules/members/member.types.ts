export interface MemberRow {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  mobile: string;
  blood_group: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
  pan_name: string | null;
  pan_number: string | null;
  created_by: string | null;
  created_on: Date;
  modified_by: string | null;
  modified_on: Date | null;
  is_active_member: boolean;
  family_id: number;
  head_id: number | null;
  is_head: boolean;
}

/** Safe member shape returned to the client (camelCase). */
export interface PublicMember {
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

export function toPublicMember(m: MemberRow): PublicMember {
  return {
    id: m.id,
    firstName: m.first_name,
    middleName: m.middle_name,
    lastName: m.last_name,
    mobile: m.mobile,
    bloodGroup: m.blood_group,
    age: m.age,
    occupation: m.occupation,
    area: m.area,
    panName: m.pan_name,
    panNumber: m.pan_number,
    isActiveMember: m.is_active_member,
    familyId: m.family_id,
    isHead: m.is_head,
  };
}

export type MatchStatus = "EXISTING_MEMBER_FOUND" | "NO_MEMBER_FOUND" | "MULTIPLE_MATCHES";

export interface MemberMatchResult {
  status: MatchStatus;
  member: PublicMember | null;
  candidates: PublicMember[];
}