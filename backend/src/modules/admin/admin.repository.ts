import type { PoolClient } from 'pg';
import { pool } from '../../config/database.js';

export interface RegistrationSummary {
  familyId: string;
  familyCode: string;
  familyStatus: string;
  createdAt: Date;
  headMemberId: string | null;
  headName: string | null;
  headMobile: string | null;
}

export interface RegistrationDetail {
  family: {
    id: string;
    familyCode: string;
    status: string;
    approvedAt: Date | null;
    createdAt: Date;
  };
  members: Array<{
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    mobile: string | null;
    isHead: boolean;
    status: string;
  }>;
}

export interface MemberListRow {
  id: string;
  familyId: string;
  familyCode: string;
  firstName: string;
  lastName: string;
  mobile: string | null;
  isHead: boolean;
  status: string;
  role: string;
}

export interface MemberDetail extends MemberListRow {
  middleName: string | null;
  bloodGroup: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
  panName: string | null;
  panNumber: string | null;
}

export interface FamilyListRow {
  id: string;
  familyCode: string;
  status: string;
  memberCount: number;
  createdAt: Date;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const findPendingRegistrations = async (
  limit: number,
  offset: number,
): Promise<Paginated<RegistrationSummary>> => {
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM families WHERE status = 'PENDING'`,
  );
  const result = await pool.query(
    `SELECT f.id AS family_id, f.family_code, f.status AS family_status,
            f.created_at, m.id AS head_member_id,
            m.first_name AS head_first_name, m.last_name AS head_last_name,
            m.mobile AS head_mobile
     FROM families f
     LEFT JOIN members m ON m.family_id = f.id AND m.is_head = TRUE
     WHERE f.status = 'PENDING'
     ORDER BY f.created_at ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  return {
    items: result.rows.map((row) => ({
      familyId: row.family_id as string,
      familyCode: row.family_code as string,
      familyStatus: row.family_status as string,
      createdAt: row.created_at as Date,
      headMemberId: (row.head_member_id as string | null) ?? null,
      headName:
        row.head_first_name != null
          ? `${row.head_first_name as string} ${row.head_last_name as string}`
          : null,
      headMobile: (row.head_mobile as string | null) ?? null,
    })),
    total: countResult.rows[0].total as number,
    limit,
    offset,
  };
};

export const findRegistrationById = async (
  familyId: string,
): Promise<RegistrationDetail | null> => {
  const familyResult = await pool.query(
    `SELECT id, family_code, status, approved_at, created_at
     FROM families WHERE id = $1`,
    [familyId],
  );
  if (!familyResult.rows[0]) {
    return null;
  }
  const family = familyResult.rows[0];
  const membersResult = await pool.query(
    `SELECT id, first_name, middle_name, last_name, mobile, is_head, status
     FROM members WHERE family_id = $1 ORDER BY is_head DESC, first_name ASC`,
    [familyId],
  );

  return {
    family: {
      id: family.id as string,
      familyCode: family.family_code as string,
      status: family.status as string,
      approvedAt: (family.approved_at as Date | null) ?? null,
      createdAt: family.created_at as Date,
    },
    members: membersResult.rows.map((row) => ({
      id: row.id as string,
      firstName: row.first_name as string,
      middleName: (row.middle_name as string | null) ?? null,
      lastName: (row.last_name as string | null) ?? null,
      mobile: (row.mobile as string | null) ?? null,
      isHead: row.is_head as boolean,
      status: row.status as string,
    })),
  };
};

export const approveRegistration = async (
  familyId: string,
  adminMemberId: string,
  client: PoolClient,
): Promise<void> => {
  await client.query(
    `UPDATE families
     SET status = 'ACTIVE', approved_by_member_id = $2, approved_at = now(),
         updated_at = now()
     WHERE id = $1`,
    [familyId, adminMemberId],
  );
  await client.query(
    `UPDATE members SET status = 'APPROVED', updated_at = now()
     WHERE family_id = $1 AND status = 'PENDING'`,
    [familyId],
  );
};

export const rejectRegistration = async (
  familyId: string,
  client: PoolClient,
): Promise<void> => {
  await client.query(
    `UPDATE families SET status = 'REJECTED', updated_at = now() WHERE id = $1`,
    [familyId],
  );
  await client.query(
    `UPDATE members SET status = 'REJECTED', updated_at = now()
     WHERE family_id = $1 AND status = 'PENDING'`,
    [familyId],
  );
};

const MEMBER_LIST_COLUMNS = `m.id, m.family_id, f.family_code, m.first_name,
  m.last_name, m.mobile, m.is_head, m.status, a.role`;

export const findMembers = async (
  status: string | undefined,
  limit: number,
  offset: number,
): Promise<Paginated<MemberListRow>> => {
  const values: Array<string | number> = [];
  let where = '';
  if (status) {
    values.push(status);
    where = `WHERE m.status = $${values.length}`;
  }
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM members m ${where}`,
    values,
  );
  const result = await pool.query(
    `SELECT ${MEMBER_LIST_COLUMNS}
     FROM members m
     JOIN families f ON f.id = m.family_id
     LEFT JOIN accounts a ON a.member_id = m.id
     ${where}
     ORDER BY m.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );

  return {
    items: result.rows.map((row) => ({
      id: row.id as string,
      familyId: row.family_id as string,
      familyCode: row.family_code as string,
      firstName: row.first_name as string,
      lastName: row.last_name as string,
      mobile: (row.mobile as string | null) ?? null,
      isHead: row.is_head as boolean,
      status: row.status as string,
      role: (row.role as string | null) ?? 'MEMBER',
    })),
    total: countResult.rows[0].total as number,
    limit,
    offset,
  };
};

export const findMemberDetailById = async (
  memberId: string,
): Promise<MemberDetail | null> => {
  const result = await pool.query(
    `SELECT m.id, m.family_id, f.family_code, m.first_name, m.middle_name,
            m.last_name, m.mobile, m.blood_group, m.age, m.occupation, m.area,
            m.pan_name, m.pan_number, m.is_head, m.status, a.role
     FROM members m
     JOIN families f ON f.id = m.family_id
     LEFT JOIN accounts a ON a.member_id = m.id
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
    familyCode: row.family_code as string,
    firstName: row.first_name as string,
    middleName: (row.middle_name as string | null) ?? null,
    lastName: row.last_name as string,
    mobile: (row.mobile as string | null) ?? null,
    bloodGroup: (row.blood_group as string | null) ?? null,
    age: (row.age as number | null) ?? null,
    occupation: (row.occupation as string | null) ?? null,
    area: (row.area as string | null) ?? null,
    panName: (row.pan_name as string | null) ?? null,
    panNumber: (row.pan_number as string | null) ?? null,
    isHead: row.is_head as boolean,
    status: row.status as string,
    role: (row.role as string | null) ?? 'MEMBER',
  };
};

const MEMBER_UPDATE_COLUMNS = new Set([
  'first_name',
  'middle_name',
  'last_name',
  'blood_group',
  'age',
  'occupation',
  'area',
  'pan_name',
  'pan_number',
]);

export const updateMember = async (
  memberId: string,
  fields: Record<string, string | number | null | undefined>,
): Promise<MemberDetail | null> => {
  const entries = Object.entries(fields).filter(
    ([column, value]) =>
      MEMBER_UPDATE_COLUMNS.has(column) && value !== undefined,
  );
  if (entries.length === 0) {
    return findMemberDetailById(memberId);
  }

  const sets = entries.map(([column], index) => `${column} = $${index + 2}`);
  const values = entries.map(([, value]) => value);
  await pool.query(
    `UPDATE members SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`,
    [memberId, ...values],
  );

  return findMemberDetailById(memberId);
};

export const updateMemberStatus = async (
  memberId: string,
  status: string,
): Promise<MemberDetail | null> => {
  await pool.query(
    `UPDATE members SET status = $2, updated_at = now() WHERE id = $1`,
    [memberId, status],
  );

  return findMemberDetailById(memberId);
};

export const findFamilies = async (
  status: string | undefined,
  limit: number,
  offset: number,
): Promise<Paginated<FamilyListRow>> => {
  const values: Array<string | number> = [];
  let where = '';
  if (status) {
    values.push(status);
    where = `WHERE f.status = $${values.length}`;
  }
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM families f ${where}`,
    values,
  );
  const result = await pool.query(
    `SELECT f.id, f.family_code, f.status, f.created_at,
            COUNT(m.id)::int AS member_count
     FROM families f
     LEFT JOIN members m ON m.family_id = f.id
     ${where}
     GROUP BY f.id
     ORDER BY f.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );

  return {
    items: result.rows.map((row) => ({
      id: row.id as string,
      familyCode: row.family_code as string,
      status: row.status as string,
      memberCount: row.member_count as number,
      createdAt: row.created_at as Date,
    })),
    total: countResult.rows[0].total as number,
    limit,
    offset,
  };
};

export const updateFamilyStatus = async (
  familyId: string,
  status: string,
): Promise<void> => {
  await pool.query(
    `UPDATE families SET status = $2, updated_at = now() WHERE id = $1`,
    [familyId, status],
  );
};
