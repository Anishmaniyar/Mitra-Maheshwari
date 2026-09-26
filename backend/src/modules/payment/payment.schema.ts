import { z } from 'zod';

// The order endpoint takes no client input: family, year, and amount are
// all determined by the backend from the authenticated user. Strict mode
// rejects any frontend-supplied payment fields.
export const createOrderSchema = z.object({}).strict();

export const paymentIdParamsSchema = z.object({
  id: z.string().uuid('Invalid payment id'),
});
