export type PaymentStatus = "pending" | "paid" | "failed";

export interface PaymentRow {
  id: number;
  family_id: number;
  year: number;
  amount: string; // NUMERIC comes back as string from pg
  currency: string;
  transaction_mode: string;
  transaction_id: string | null;
  status: PaymentStatus;
  created_at: Date;
  updated_at: Date;
}

export interface PublicPayment {
  id: number;
  familyId: number;
  year: number;
  amount: number;
  currency: string;
  transactionMode: string;
  transactionId: string | null;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicPayment(p: PaymentRow): PublicPayment {
  return {
    id: p.id,
    familyId: p.family_id,
    year: p.year,
    amount: Number(p.amount),
    currency: p.currency,
    transactionMode: p.transaction_mode,
    transactionId: p.transaction_id,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}