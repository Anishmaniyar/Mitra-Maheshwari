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
    bloodGroup: string | null;
    age: number | null;
    occupation: string | null;
    area: string | null;
    panName: string | null;
    panNumber: string | null;
    isHead: boolean;
    status: string;
  }>;
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
    `SELECT id, first_name, middle_name, last_name, mobile, blood_group, age,
            occupation, area, pan_name, pan_number, is_head, status
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
      bloodGroup: (row.blood_group as string | null) ?? null,
      age: (row.age as number | null) ?? null,
      occupation: (row.occupation as string | null) ?? null,
      area: (row.area as string | null) ?? null,
      panName: (row.pan_name as string | null) ?? null,
      panNumber: (row.pan_number as string | null) ?? null,
      isHead: row.is_head as boolean,
      status: row.status as string,
    })),
  };
};

export const approveRegistration = async (
  familyId: string,
  client: PoolClient,
): Promise<void> => {
  // Shared-link admins have no member identity; the approval reference stays
  // NULL while approved_at still records when the decision happened.
  await client.query(
    `UPDATE families
     SET status = 'ACTIVE', approved_by_member_id = NULL, approved_at = now(),
         updated_at = now()
     WHERE id = $1`,
    [familyId],
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
