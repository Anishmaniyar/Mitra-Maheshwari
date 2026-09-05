import { pool } from "../../config/database";
import type { MemberRow } from "./member.types";

const selectColumns = `
  id, first_name, middle_name, last_name, mobile, blood_group, age, occupation, area,
  pan_name, pan_number, created_by, created_on, modified_by, modified_on,
  is_active_member, family_id, head_id, is_head
`;

export async function findById(id: number): Promise<MemberRow | null> {
  const { rows } = await pool.query<MemberRow>(`SELECT ${selectColumns} FROM members WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findByMobile(mobile: string): Promise<MemberRow | null> {
  const { rows } = await pool.query<MemberRow>(`SELECT ${selectColumns} FROM members WHERE mobile = $1`, [mobile]);
  return rows[0] ?? null;
}

/** Name-based candidate search used when the mobile number does not match. */
export async function findByNameCandidates(firstName: string, lastName: string): Promise<MemberRow[]> {
  const { rows } = await pool.query<MemberRow>(
    `SELECT ${selectColumns} FROM members
     WHERE lower(first_name) = lower($1) AND lower(last_name) = lower($2)
     ORDER BY is_head DESC, id ASC`,
    [firstName, lastName],
  );
  return rows;
}

export async function findByFamilyId(familyId: number): Promise<MemberRow[]> {
  const { rows } = await pool.query<MemberRow>(
    `SELECT ${selectColumns} FROM members WHERE family_id = $1 ORDER BY is_head DESC, id ASC`,
    [familyId],
  );
  return rows;
}

/** Fields a member may correct on their own profile. */
const editableColumns: Record<string, string> = {
  firstName: "first_name",
  middleName: "middle_name",
  lastName: "last_name",
  bloodGroup: "blood_group",
  age: "age",
  occupation: "occupation",
  area: "area",
  panName: "pan_name",
  panNumber: "pan_number",
};

export async function updateProfile(
  id: number,
  data: Record<string, unknown>,
): Promise<MemberRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of Object.entries(editableColumns)) {
    if (key in data) {
      values.push(data[key] ?? null);
      sets.push(`${col} = $${values.length}`);
    }
  }
  if (sets.length === 0) return findById(id);

  values.push(id);
  const { rows } = await pool.query<MemberRow>(
    `UPDATE members SET ${sets.join(", ")}, modified_by = 'member', modified_on = now()
     WHERE id = $${values.length}
     RETURNING ${selectColumns}`,
    values,
  );
  return rows[0] ?? null;
}

/**
 * Creates a family and its head member atomically (one transaction). Used for
 * the new-registration flow so a family never exists without its head.
 */
export async function createFamilyHead(input: {
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
}): Promise<MemberRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const famRes = await client.query<{ id: number }>(
      "INSERT INTO families (created_by) VALUES ($1) RETURNING id",
      ["member-registration"],
    );
    const familyId = famRes.rows[0]!.id;

    const memberRes = await client.query<MemberRow>(
      `INSERT INTO members
         (first_name, middle_name, last_name, mobile, blood_group, age, occupation, area,
          pan_name, pan_number, created_by, family_id, is_head)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
       RETURNING ${selectColumns}`,
      [
        input.firstName,
        input.middleName,
        input.lastName,
        input.mobile,
        input.bloodGroup,
        input.age,
        input.occupation,
        input.area,
        input.panName,
        input.panNumber,
        "member-registration",
        familyId,
      ],
    );
    const member = memberRes.rows[0]!;

    // The head's head_id points at themselves.
    await client.query("UPDATE members SET head_id = $1 WHERE id = $1", [member.id]);

    await client.query("COMMIT");
    return member;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Adds a member to an existing family (family-head flow). */
export async function addMemberToFamily(input: {
  familyId: number;
  headId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  mobile: string;
  bloodGroup: string | null;
  age: number | null;
  occupation: string | null;
  area: string | null;
}): Promise<MemberRow> {
  const { rows } = await pool.query<MemberRow>(
    `INSERT INTO members
       (first_name, middle_name, last_name, mobile, blood_group, age, occupation, area,
        created_by, family_id, head_id, is_head)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false)
     RETURNING ${selectColumns}`,
    [
      input.firstName,
      input.middleName,
      input.lastName,
      input.mobile,
      input.bloodGroup,
      input.age,
      input.occupation,
      input.area,
      "family-head",
      input.familyId,
      input.headId,
    ],
  );
  return rows[0]!;
}