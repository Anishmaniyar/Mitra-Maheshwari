/**
 * Explicit snake_case row shapes for the family queries, kept separate from the
 * repository so they can be unit tested without a database connection.
 */
export type FamilyMemberDbRow = {
  id: string;
  family_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  mobile: string | null;
  blood_group: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
  is_head: boolean;
  status: string;
};

export interface FamilyMemberRow {
  id: string;
  familyId: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  mobile: string | null;
  bloodGroup: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
  isHead: boolean;
  status: string;
}

export type InvitationDbRow = {
  id: string;
  family_id: string;
  invited_by_member_id: string;
  invitee_name: string;
  invitee_mobile: string | null;
  invitee_email: string | null;
  token: string;
  status: string;
  expires_at: Date;
  accepted_at: Date | null;
};

export interface InvitationRow {
  id: string;
  familyId: string;
  invitedByMemberId: string;
  inviteeName: string;
  inviteeMobile: string | null;
  inviteeEmail: string | null;
  token: string;
  status: string;
  expiresAt: Date;
  acceptedAt: Date | null;
}

export const mapFamilyMemberRow = (row: FamilyMemberDbRow): FamilyMemberRow => ({
  id: row.id,
  familyId: row.family_id,
  firstName: row.first_name,
  middleName: row.middle_name ?? null,
  lastName: row.last_name ?? null,
  mobile: row.mobile ?? null,
  bloodGroup: row.blood_group ?? null,
  age: row.age ?? null,
  occupation: row.occupation ?? null,
  area: row.area ?? null,
  isHead: row.is_head,
  status: row.status,
});

export const mapInvitationRow = (row: InvitationDbRow): InvitationRow => ({
  id: row.id,
  familyId: row.family_id,
  invitedByMemberId: row.invited_by_member_id,
  inviteeName: row.invitee_name,
  inviteeMobile: row.invitee_mobile ?? null,
  inviteeEmail: row.invitee_email ?? null,
  token: row.token,
  status: row.status,
  expiresAt: row.expires_at,
  acceptedAt: row.accepted_at ?? null,
});
