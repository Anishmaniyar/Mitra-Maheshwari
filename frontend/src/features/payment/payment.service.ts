import { DEMO_MODE, demoCreatePayment, demoGetPayments } from "../../config/demo";
import { api } from "../../services/api";
import type { Payment } from "../../types/api";

export function getPayments(): Promise<{ payments: Payment[] }> {
  if (DEMO_MODE) return demoGetPayments();
  return api<{ payments: Payment[] }>("/payments");
}

export function createPayment(): Promise<{ payment: Payment }> {
  if (DEMO_MODE) return demoCreatePayment();
  return api<{ payment: Payment }>("/payments/create", { method: "POST" });
}