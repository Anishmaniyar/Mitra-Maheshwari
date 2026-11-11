import { pool } from '../../config/database.js';
import { mapPaymentRow } from './payment.mapper.js';
import type { PaymentDbRow, PaymentRow } from './payment.mapper.js';

export type { PaymentRow } from './payment.mapper.js';

const PAYMENT_COLUMNS = `id, family_id, initiated_by_member_id, "year",
  amount, currency, status, provider, provider_order_id, provider_payment_id,
  receipt, created_at, updated_at`;

export const createPayment = async (input: {
  familyId: string;
  initiatedByMemberId: string;
  year: number;
  amount: number;
  currency: string;
  receipt: string;
}): Promise<PaymentRow> => {
  const result = await pool.query<PaymentDbRow>(
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
  const result = await pool.query<PaymentDbRow>(
    `SELECT ${PAYMENT_COLUMNS} FROM payments
     WHERE family_id = $1 AND "year" = $2
       AND status IN ('AUTHORIZED', 'CAPTURED')
     LIMIT 1`,
    [familyId, year],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};

/** The single attempt that may still become a payment for this family/year.
    A partial unique index guarantees at most one PENDING/ORDER_CREATED row. */
export const findOpenPaymentByFamilyAndYear = async (
  familyId: string,
  year: number,
): Promise<PaymentRow | null> => {
  const result = await pool.query<PaymentDbRow>(
    `SELECT ${PAYMENT_COLUMNS} FROM payments
     WHERE family_id = $1 AND "year" = $2
       AND status IN ('PENDING', 'ORDER_CREATED')
     ORDER BY created_at DESC
     LIMIT 1`,
    [familyId, year],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};

export const findPaymentByProviderOrderId = async (
  providerOrderId: string,
): Promise<PaymentRow | null> => {
  const result = await pool.query<PaymentDbRow>(
    `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE provider_order_id = $1`,
    [providerOrderId],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};

export const updatePaymentProviderOrder = async (
  id: string,
  providerOrderId: string,
): Promise<PaymentRow> => {
  const result = await pool.query<PaymentDbRow>(
    `UPDATE payments
     SET provider_order_id = $2, status = 'ORDER_CREATED', updated_at = now()
     WHERE id = $1
     RETURNING ${PAYMENT_COLUMNS}`,
    [id, providerOrderId],
  );

  return mapPaymentRow(result.rows[0]);
};

/** Releases an abandoned attempt so a fresh one can be created. Only open
    attempts are touched: a provider-confirmed payment is never downgraded. */
export const markPaymentFailed = async (id: string): Promise<PaymentRow | null> => {
  const result = await pool.query<PaymentDbRow>(
    `UPDATE payments
     SET status = 'FAILED', updated_at = now()
     WHERE id = $1 AND status IN ('PENDING', 'ORDER_CREATED')
     RETURNING ${PAYMENT_COLUMNS}`,
    [id],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};

// Forward-only status transition with built-in idempotency guard:
// PENDING/ORDER_CREATED → AUTHORIZED/CAPTURED/FAILED,
// AUTHORIZED → CAPTURED, never leaves CAPTURED/REFUNDED.
export const transitionPaymentStatus = async (
  id: string,
  toStatus: 'AUTHORIZED' | 'CAPTURED' | 'FAILED',
  providerPaymentId?: string,
): Promise<PaymentRow | null> => {
  const result = await pool.query<PaymentDbRow>(
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
  const result = await pool.query<PaymentDbRow>(
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
  const result = await pool.query<PaymentDbRow>(
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
  const result = await pool.query<PaymentDbRow>(
    `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE id = $1`,
    [id],
  );

  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
};
