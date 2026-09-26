import { pool } from '../../config/database.js';

export interface PaymentRow {
  id: string;
  familyId: string;
  initiatedByMemberId: string | null;
  year: number;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  receipt: string;
  createdAt: Date;
  updatedAt: Date;
}

const PAYMENT_COLUMNS = `id, family_id, initiated_by_member_id, "year",
  amount, currency, status, provider, provider_order_id, provider_payment_id,
  receipt, created_at, updated_at`;

const mapPaymentRow = (row: Record<string, never>): PaymentRow => ({
  id: row.id as string,
  familyId: row.family_id as string,
  initiatedByMemberId: (row.initiated_by_member_id as string | null) ?? null,
  year: row.year as number,
  amount: Number(row.amount),
  currency: row.currency as string,
  status: row.status as string,
  provider: row.provider as string,
  providerOrderId: (row.provider_order_id as string | null) ?? null,
  providerPaymentId: (row.provider_payment_id as string | null) ?? null,
  receipt: row.receipt as string,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export const createPayment = async (input: {
  familyId: string;
  initiatedByMemberId: string;
  year: number;
  amount: number;
  currency: string;
  receipt: string;
}): Promise<PaymentRow> => {
  const result = await pool.query(
    `INSERT INTO payments
       (family_id, initiated_by_member_id, "year", amount, currency, receipt)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${PAYMENT_COLUMNS}`,
    [
      input.familyId,
      input.initiatedByMemberId,
      input.year,
      input.amount,
      input.currency,
      input.receipt,
    ],
  );

  return mapPaymentRow(result.rows[0]);
};

export const findSuccessfulPaymentByFamilyAndYear = async (
  familyId: string,
  year: number,
): Promise<PaymentRow | null> => {
  const result = await pool.query(
    `SELECT ${PAYMENT_COLUMNS} FROM payments
     WHERE family_id = $1 AND "year" = $2
       AND status IN ('AUTHORIZED', 'CAPTURED')
     LIMIT 1`,
    [familyId, year],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};

export const findPaymentsByFamilyId = async (
  familyId: string,
): Promise<PaymentRow[]> => {
  const result = await pool.query(
    `SELECT ${PAYMENT_COLUMNS} FROM payments
     WHERE family_id = $1
     ORDER BY created_at DESC`,
    [familyId],
  );

  return result.rows.map(mapPaymentRow);
};

export const findPaymentById = async (
  id: string,
): Promise<PaymentRow | null> => {
  const result = await pool.query(
    `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE id = $1`,
    [id],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};
