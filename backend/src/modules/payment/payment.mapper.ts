/**
 * Row shape returned by the payment queries. Typed explicitly (snake_case,
 * exactly what PostgreSQL returns) so a renamed column is a compile error
 * instead of a silent `undefined`. NUMERIC arrives as a string from pg and is
 * coerced in the mapper.
 */
export type PaymentDbRow = {
  id: string;
  family_id: string;
  initiated_by_member_id: string | null;
  year: number;
  amount: string | number;
  currency: string;
  status: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  receipt: string;
  created_at: Date;
  updated_at: Date;
};

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

export const mapPaymentRow = (row: PaymentDbRow): PaymentRow => ({
  id: row.id,
  familyId: row.family_id,
  initiatedByMemberId: row.initiated_by_member_id ?? null,
  year: row.year,
  amount: Number(row.amount),
  currency: row.currency,
  status: row.status,
  provider: row.provider,
  providerOrderId: row.provider_order_id ?? null,
  providerPaymentId: row.provider_payment_id ?? null,
  receipt: row.receipt,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
