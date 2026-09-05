import { pool } from "../../config/database";
import type { MemberRow } from "../members/member.types";
import type { PaymentRow } from "../payment/payment.types";

export async function getFamilyIdForMember(memberId: number): Promise<number | null> {
  const { rows } = await pool.query<{ family_id: number }>(
    "SELECT family_id FROM members WHERE id = $1",
    [memberId],
  );
  return rows[0]?.family_id ?? null;
}

export async function getFamilyHeadId(familyId: number): Promise<number | null> {
  const { rows } = await pool.query<{ id: number }>(
    "SELECT id FROM members WHERE family_id = $1 AND is_head = true LIMIT 1",
    [familyId],
  );
  return rows[0]?.id ?? null;
}

export async function getFamilyMembers(familyId: number): Promise<MemberRow[]> {
  const { rows } = await pool.query<MemberRow>(
    `SELECT id, first_name, middle_name, last_name, mobile, blood_group, age, occupation, area,
            pan_name, pan_number, created_by, created_on, modified_by, modified_on,
            is_active_member, family_id, head_id, is_head
     FROM members WHERE family_id = $1 ORDER BY is_head DESC, id ASC`,
    [familyId],
  );
  return rows;
}

export async function getLatestPayment(familyId: number): Promise<PaymentRow | null> {
  const { rows } = await pool.query<PaymentRow>(
    "SELECT * FROM payments WHERE family_id = $1 ORDER BY year DESC, created_at DESC LIMIT 1",
    [familyId],
  );
  return rows[0] ?? null;
}