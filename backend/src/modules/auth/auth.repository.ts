import type { PoolClient } from 'pg';
import { pool } from '../../config/database.js';
import type { Role } from '../../shared/types/auth.types.js';

export interface AuthIdentity {
  memberId: string;
  accountId: string;
  familyId: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  mobile: string;
  status: string;
  isHead: boolean;
  role: Role;
}

export interface MemberProfile {
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
  role: Role;
  isHead: boolean;
  status: string;
}

export interface RefreshTokenRecord {
  id: string;
  memberId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
}

type AuthIdentityDbRow = {
  member_id: string;
  account_id: string;
  family_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  account_mobile: string;
  status: string;
  is_head: boolean;
  role: Role;
};

const mapIdentityRow = (row: AuthIdentityDbRow): AuthIdentity => ({
  memberId: row.member_id,
  accountId: row.account_id,
  familyId: row.family_id,
  firstName: row.first_name,
  middleName: row.middle_name ?? null,
  lastName: row.last_name ?? null,
  mobile: row.account_mobile,
  status: row.status,
  isHead: row.is_head,
  role: row.role,
});

export const findAuthIdentityByMobile = async (
  mobile: string,
): Promise<AuthIdentity | null> => {
  const result = await pool.query<AuthIdentityDbRow>(
    `SELECT m.id AS member_id, m.family_id, m.first_name, m.middle_name, m.last_name,
            a.mobile AS account_mobile, m.status, m.is_head,
            a.id AS account_id, a.role
     FROM accounts a
     JOIN members m ON m.id = a.member_id
     WHERE a.mobile = $1`,
    [mobile],
  );

  return result.rows[0] ? mapIdentityRow(result.rows[0]) : null;
};

export const findMemberProfileById = async (
  memberId: string,
): Promise<MemberProfile | null> => {
  const result = await pool.query(
    `SELECT m.id, m.family_id, m.first_name, m.middle_name, m.last_name,
            a.mobile, m.blood_group, m.age, m.occupation, m.area,
            a.role, m.is_head, m.status
     FROM members m
     JOIN accounts a ON a.member_id = m.id
     WHERE m.id = $1`,
    [memberId],
  );

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    familyId: row.family_id as string,
    firstName: row.first_name as string,
    middleName: (row.middle_name as string | null) ?? null,
    lastName: (row.last_name as string | null) ?? null,
    mobile: row.mobile as string,
    bloodGroup: (row.blood_group as string | null) ?? null,
    age: (row.age as number | null) ?? null,
    occupation: (row.occupation as string | null) ?? null,
    area: (row.area as string | null) ?? null,
    role: row.role as Role,
    isHead: row.is_head as boolean,
    status: row.status as string,
  };
};

export const updateLastLoginAt = async (accountId: string): Promise<void> => {
  await pool.query(`UPDATE accounts SET last_login_at = now() WHERE id = $1`, [
    accountId,
  ]);
};

export const createRefreshToken = async (
  input: { memberId: string; tokenHash: string; expiresAt: Date },
  client: PoolClient,
): Promise<RefreshTokenRecord> => {
  const result = await client.query(
    `INSERT INTO refresh_tokens (member_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, member_id, token_hash, expires_at, revoked_at, replaced_by_token_id`,
    [input.memberId, input.tokenHash, input.expiresAt],
  );

  const row = result.rows[0];
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    tokenHash: row.token_hash as string,
    expiresAt: row.expires_at as Date,
    revokedAt: (row.revoked_at as Date | null) ?? null,
    replacedByTokenId: (row.replaced_by_token_id as string | null) ?? null,
  };
};

export const findRefreshTokenByHash = async (
  tokenHash: string,
): Promise<RefreshTokenRecord | null> => {
  const result = await pool.query(
    `SELECT id, member_id, token_hash, expires_at, revoked_at, replaced_by_token_id
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash],
  );

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    tokenHash: row.token_hash as string,
    expiresAt: row.expires_at as Date,
    revokedAt: (row.revoked_at as Date | null) ?? null,
    replacedByTokenId: (row.replaced_by_token_id as string | null) ?? null,
  };
};

export const revokeRefreshToken = async (
  id: string,
  replacedByTokenId: string | null,
  client?: PoolClient,
): Promise<void> => {
  const db = client ?? pool;
  await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = now(), replaced_by_token_id = $2
     WHERE id = $1`,
    [id, replacedByTokenId],
  );
};

export const revokeActiveRefreshTokensForMember = async (
  memberId: string,
  client?: PoolClient,
): Promise<void> => {
  const db = client ?? pool;
  await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = now()
     WHERE member_id = $1 AND revoked_at IS NULL`,
    [memberId],
  );
};
