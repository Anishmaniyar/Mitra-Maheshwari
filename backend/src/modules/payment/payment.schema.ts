import { z } from 'zod';

// The order endpoint takes no client input: family, year, and amount are
// all determined by the backend from the authenticated user. Strict mode
// rejects any frontend-supplied payment fields.
export const createOrderSchema = z.object({}).strict();

export const paymentIdParamsSchema = z.object({
  id: z.string().uuid('Invalid payment id'),
});

// Field names match the Razorpay Checkout callback; the values are only
// lookup material — trust comes from backend signature verification.
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order id is required'),
  razorpay_payment_id: z.string().min(1, 'Payment id is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});
