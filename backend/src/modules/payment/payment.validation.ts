import { z } from "zod";

/**
 * Generic gateway webhook payload. When a concrete provider (Razorpay/Cashfree)
 * is integrated, adapt their event shape to this in the service while keeping
 * signature verification provider-specific.
 */
export const paymentWebhookSchema = z.object({
  event: z.enum(["payment.paid", "payment.failed"]),
  transactionId: z.string().min(1),
  amount: z.number().positive().optional(),
  currency: z.string().min(3).optional(),
});

export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;