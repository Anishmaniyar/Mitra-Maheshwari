import { api } from "../../services/api";
import type { CreateOrderResponse, Payment } from "../../types/api";

interface BackendPayment {
  id: string;
  familyId: string;
  year: number;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerPaymentId: string | null;
  receipt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A payment counts as successful once Razorpay has accepted it: AUTHORIZED
 * (funds held, capture follows via webhook) and CAPTURED both mean the family
 * has paid for the year. This matches the backend, which also treats both
 * statuses as "already paid" and rejects a second order.
 */
function toPaymentStatus(status: string): Payment["status"] {
  if (status === "CAPTURED" || status === "AUTHORIZED") return "paid";
  if (status === "FAILED") return "failed";
  return "pending";
}

function toPayment(row: BackendPayment): Payment {
  return {
    id: row.id,
    familyId: row.familyId,
    year: row.year,
    amount: row.amount,
    currency: row.currency,
    transactionMode: row.provider,
    transactionId: row.providerPaymentId ?? row.receipt,
    status: toPaymentStatus(row.status),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getPayments(): Promise<{ payments: Payment[] }> {
  return api<BackendPayment[]>("/payments").then((rows) => ({
    payments: rows.map(toPayment),
  }));
}

export function createPayment(): Promise<CreateOrderResponse> {
  return api<{ payment: BackendPayment; checkout: CreateOrderResponse["checkout"] }>(
    "/payments/order",
    { method: "POST", body: {} },
  ).then((data) => ({ payment: toPayment(data.payment), checkout: data.checkout }));
}

export function verifyPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ payment: Payment }> {
  return api<BackendPayment>("/payments/verify", {
    method: "POST",
    body: {
      razorpay_order_id: input.orderId,
      razorpay_payment_id: input.paymentId,
      razorpay_signature: input.signature,
    },
  }).then((payment) => ({ payment: toPayment(payment) }));
}

interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load the payment gateway. Please check your connection and try again."));
    document.body.appendChild(script);
  });
}

/** Opens Razorpay Checkout for a server-created order; resolves with the
    gateway result (never treated as success until backend verification). */
export async function payWithRazorpay(checkout: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
}): Promise<{ orderId: string; paymentId: string; signature: string }> {
  await loadRazorpayScript();
  const RazorpayCheckout = window.Razorpay;
  if (!RazorpayCheckout) {
    throw new Error("Payment gateway is unavailable. Please try again later.");
  }
  return new Promise((resolve, reject) => {
    const rzp = new RazorpayCheckout({
      key: checkout.keyId,
      order_id: checkout.orderId,
      amount: checkout.amountPaise,
      currency: checkout.currency,
      name: "Mitra Maheshwari",
      description: "Annual family membership",
      handler: (response) =>
        resolve({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      modal: {
        ondismiss: () => reject(new Error("Payment was cancelled before completion.")),
      },
    });
    rzp.open();
  });
}
