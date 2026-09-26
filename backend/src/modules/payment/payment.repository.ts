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

export const findPaymentByProviderOrderId = async (
  providerOrderId: string,
): Promise<PaymentRow | null> => {
  const result = await pool.query(
    `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE provider_order_id = $1`,
    [providerOrderId],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};

export const updatePaymentProviderOrder = async (
  id: string,
  providerOrderId: string,
): Promise<PaymentRow> => {
  const result = await pool.query(
    `UPDATE payments
     SET provider_order_id = $2, status = 'ORDER_CREATED', updated_at = now()
     WHERE id = $1
     RETURNING ${PAYMENT_COLUMNS}`,
    [id, providerOrderId],
  );

  return mapPaymentRow(result.rows[0]);
};

// Forward-only status transition with built-in idempotency guard:
// PENDING/ORDER_CREATED → AUTHORIZED/CAPTURED/FAILED,
// AUTHORIZED → CAPTURED, never leaves CAPTURED/REFUNDED.
export const transitionPaymentStatus = async (
  id: string,
  toStatus: 'AUTHORIZED' | 'CAPTURED' | 'FAILED',
  providerPaymentId?: string,
): Promise<PaymentRow | null> => {
  const result = await pool.query(
    `UPDATE payments
     SET status = CASE
       WHEN status IN ('PENDING', 'ORDER_CREATED')
         AND $2 IN ('AUTHORIZED', 'CAPTURED', 'FAILED') THEN $2::payment_status
       WHEN status = 'AUTHORIZED' AND $2 = 'CAPTURED' THEN $2::payment_status
       ELSE status
     END,
     provider_payment_id = COALESCE($3, provider_payment_id),
     updated_at = now()
     WHERE id = $1
     RETURNING ${PAYMENT_COLUMNS}`,
    [id, toStatus, providerPaymentId ?? null],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};

export const findLatestPaymentByFamilyAndYear = async (
  familyId: string,
  year: number,
): Promise<PaymentRow | null> => {
  const result = await pool.query(
    `SELECT ${PAYMENT_COLUMNS} FROM payments
     WHERE family_id = $1 AND "year" = $2
     ORDER BY created_at DESC
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
