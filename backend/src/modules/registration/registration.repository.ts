import type { PoolClient } from 'pg';
import { pool } from '../../config/database.js';

export interface CreatedFamily {
  id: string;
  familyCode: string;
  status: string;
}

export interface CreatedMember {
  id: string;
  familyId: string;
  status: string;
}

export interface CreatedAccount {
  id: string;
  memberId: string;
}

export interface NameCandidate {
  id: string;
  familyId: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  status: string;
}

export const findRecentConsumedOtpByMobile = async (
  mobile: string,
  since: Date,
): Promise<{ id: string } | null> => {
  const result = await pool.query(
    `SELECT id
     FROM otps
     WHERE mobile = $1 AND consumed_at IS NOT NULL AND consumed_at >= $2
     ORDER BY consumed_at DESC
     LIMIT 1`,
    [mobile, since],
  );

  return result.rows[0] ? { id: result.rows[0].id as string } : null;
};

export const findCandidateMembersByName = async (
  firstName: string,
  lastName: string,
): Promise<NameCandidate[]> => {
  const result = await pool.query(
    `SELECT id, family_id, first_name, middle_name, last_name, status
     FROM members
     WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2)
     LIMIT 10`,
    [firstName, lastName],
  );

  return result.rows.map((row) => ({
    id: row.id as string,
    familyId: row.family_id as string,
    firstName: row.first_name as string,
    middleName: (row.middle_name as string | null) ?? null,
    lastName: (row.last_name as string | null) ?? null,
    status: row.status as string,
  }));
};

export const createFamily = async (
  input: { familyCode: string; status: string },
  client: PoolClient,
): Promise<CreatedFamily> => {
  const result = await client.query(
    `INSERT INTO families (family_code, status)
     VALUES ($1, $2)
     RETURNING id, family_code, status`,
    [input.familyCode, input.status],
  );

  const row = result.rows[0];
  return {
    id: row.id as string,
    familyCode: row.family_code as string,
    status: row.status as string,
  };
};

export const createMember = async (
  input: {
    familyId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    mobile: string;
    bloodGroup?: string;
    age?: number;
    occupation?: string;
    area?: string;
    panName?: string;
    panNumber?: string;
    isHead: boolean;
    status: string;
  },
  client: PoolClient,
): Promise<CreatedMember> => {
  const result = await client.query(
    `INSERT INTO members
       (family_id, first_name, middle_name, last_name, mobile, blood_group,
        age, occupation, area, pan_name, pan_number, is_head, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, family_id, status`,
    [
      input.familyId,
      input.firstName,
      input.middleName ?? null,
      input.lastName,
      input.mobile,
      input.bloodGroup ?? null,
      input.age ?? null,
      input.occupation ?? null,
      input.area ?? null,
      input.panName ?? null,
      input.panNumber ?? null,
      input.isHead,
      input.status,
    ],
  );

  const row = result.rows[0];
  return {
    id: row.id as string,
    familyId: row.family_id as string,
    status: row.status as string,
  };
};

export const createAccount = async (
  input: { memberId: string; mobile: string },
  client: PoolClient,
): Promise<CreatedAccount> => {
  const result = await client.query(
    `INSERT INTO accounts (member_id, mobile)
     VALUES ($1, $2)
     RETURNING id, member_id`,
    [input.memberId, input.mobile],
  );

  const row = result.rows[0];
  return {
    id: row.id as string,
    memberId: row.member_id as string,
  };
};
