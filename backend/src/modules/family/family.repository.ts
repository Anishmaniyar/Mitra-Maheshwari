import type { PoolClient } from 'pg';
import { pool } from '../../config/database.js';

export interface FamilyRow {
  id: string;
  familyCode: string;
  status: string;
}

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

const mapMemberRow = (row: Record<string, never>): FamilyMemberRow => ({
  id: row.id as string,
  familyId: row.family_id as string,
  firstName: row.first_name as string,
  middleName: (row.middle_name as string | null) ?? null,
  lastName: (row.last_name as string | null) ?? null,
  mobile: (row.mobile as string | null) ?? null,
  bloodGroup: (row.blood_group as string | null) ?? null,
  age: (row.age as number | null) ?? null,
  occupation: (row.occupation as string | null) ?? null,
  area: (row.area as string | null) ?? null,
  isHead: row.is_head as boolean,
  status: row.status as string,
});

const mapInvitationRow = (row: Record<string, never>): InvitationRow => ({
  id: row.id as string,
  familyId: row.family_id as string,
  invitedByMemberId: row.invited_by_member_id as string,
  inviteeName: row.invitee_name as string,
  inviteeMobile: (row.invitee_mobile as string | null) ?? null,
  inviteeEmail: (row.invitee_email as string | null) ?? null,
  token: row.token as string,
  status: row.status as string,
  expiresAt: row.expires_at as Date,
  acceptedAt: (row.accepted_at as Date | null) ?? null,
});

const MEMBER_COLUMNS = `id, family_id, first_name, middle_name, last_name,
  mobile, blood_group, age, occupation, area, is_head, status`;

const INVITATION_COLUMNS = `id, family_id, invited_by_member_id, invitee_name,
  invitee_mobile, invitee_email, token, status, expires_at, accepted_at`;

export const findFamilyById = async (
  familyId: string,
): Promise<FamilyRow | null> => {
  const result = await pool.query(
    `SELECT id, family_code, status FROM families WHERE id = $1`,
    [familyId],
  );

  if (!result.rows[0]) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row.id as string,
    familyCode: row.family_code as string,
    status: row.status as string,
  };
};

export const findFamilyMembers = async (
  familyId: string,
): Promise<FamilyMemberRow[]> => {
  const result = await pool.query(
    `SELECT ${MEMBER_COLUMNS} FROM members
     WHERE family_id = $1
     ORDER BY is_head DESC, first_name ASC`,
    [familyId],
  );

  return result.rows.map(mapMemberRow);
};

export const findFamilyMemberById = async (
  memberId: string,
): Promise<FamilyMemberRow | null> => {
  const result = await pool.query(
    `SELECT ${MEMBER_COLUMNS} FROM members WHERE id = $1`,
    [memberId],
  );

  return result.rows[0] ? mapMemberRow(result.rows[0]) : null;
};

export const createInvitation = async (input: {
  familyId: string;
  invitedByMemberId: string;
  inviteeName: string;
  inviteeMobile?: string;
  inviteeEmail?: string;
  token: string;
  expiresAt: Date;
}): Promise<InvitationRow> => {
  const result = await pool.query(
    `INSERT INTO family_invitations
       (family_id, invited_by_member_id, invitee_name, invitee_mobile,
        invitee_email, token, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
     RETURNING ${INVITATION_COLUMNS}`,
    [
      input.familyId,
      input.invitedByMemberId,
      input.inviteeName,
      input.inviteeMobile ?? null,
      input.inviteeEmail ?? null,
      input.token,
      input.expiresAt,
    ],
  );

  return mapInvitationRow(result.rows[0]);
};

export const findInvitationsByFamilyId = async (
  familyId: string,
): Promise<InvitationRow[]> => {
  const result = await pool.query(
    `SELECT ${INVITATION_COLUMNS} FROM family_invitations
     WHERE family_id = $1
     ORDER BY created_at DESC`,
    [familyId],
  );

  return result.rows.map(mapInvitationRow);
};

export const findInvitationById = async (
  id: string,
): Promise<InvitationRow | null> => {
  const result = await pool.query(
    `SELECT ${INVITATION_COLUMNS} FROM family_invitations WHERE id = $1`,
    [id],
  );

  return result.rows[0] ? mapInvitationRow(result.rows[0]) : null;
};

export const cancelInvitation = async (id: string): Promise<void> => {
  await pool.query(
    `UPDATE family_invitations SET status = 'CANCELLED' WHERE id = $1`,
    [id],
  );
};

export const cancelSentInvitationsByInviter = async (
  memberId: string,
  client: PoolClient,
): Promise<void> => {
  await client.query(
    `UPDATE family_invitations
     SET status = 'CANCELLED'
     WHERE invited_by_member_id = $1 AND status = 'PENDING'`,
    [memberId],
  );
};

export const deleteMemberById = async (
  memberId: string,
  client: PoolClient,
): Promise<void> => {
  await client.query(`DELETE FROM members WHERE id = $1`, [memberId]);
};
