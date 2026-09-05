import { pool } from "../../config/database";
import type { PaymentRow, PaymentStatus } from "./payment.types";

export async function findForYear(familyId: number, year: number): Promise<PaymentRow | null> {
  const { rows } = await pool.query<PaymentRow>(
    "SELECT * FROM payments WHERE family_id = $1 AND year = $2",
    [familyId, year],
  );
  return rows[0] ?? null;
}

export async function findByTransactionId(transactionId: string): Promise<PaymentRow | null> {
  const { rows } = await pool.query<PaymentRow>(
    "SELECT * FROM payments WHERE transaction_id = $1",
    [transactionId],
  );
  return rows[0] ?? null;
}

export async function listByFamily(familyId: number): Promise<PaymentRow[]> {
  const { rows } = await pool.query<PaymentRow>(
    "SELECT * FROM payments WHERE family_id = $1 ORDER BY year DESC, created_at DESC",
    [familyId],
  );
  return rows;
}

export async function createPayment(input: {
  familyId: number;
  year: number;
  amount: number;
  currency: string;
  transactionMode: string;
  transactionId: string;
}): Promise<PaymentRow> {
  const { rows } = await pool.query<PaymentRow>(
    `INSERT INTO payments (family_id, year, amount, currency, transaction_mode, transaction_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.familyId, input.year, input.amount, input.currency, input.transactionMode, input.transactionId],
  );
  return rows[0]!;
}

/** Re-arms a failed payment for retry with a fresh transaction reference. */
export async function resetPayment(
  familyId: number,
  year: number,
  transactionId: string,
): Promise<PaymentRow | null> {
  const { rows } = await pool.query<PaymentRow>(
    `UPDATE payments
     SET status = 'pending', transaction_id = $3, updated_at = now()
     WHERE family_id = $1 AND year = $2
     RETURNING *`,
    [familyId, year, transactionId],
  );
  return rows[0] ?? null;
}

export async function setStatus(
  id: number,
  status: PaymentStatus,
): Promise<PaymentRow | null> {
  const { rows } = await pool.query<PaymentRow>(
    "UPDATE payments SET status = $2, updated_at = now() WHERE id = $1 RETURNING *",
    [id, status],
  );
  return rows[0] ?? null;
}