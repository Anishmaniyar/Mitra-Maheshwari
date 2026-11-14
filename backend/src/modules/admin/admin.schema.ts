import { z } from 'zod';

export const registrationIdParamsSchema = z.object({
  id: z.string().uuid('Invalid registration id'),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const registrationsQuerySchema = paginationQuerySchema.extend({});

export const adminSessionSchema = z.object({
  secret: z.string().trim().min(1, 'Admin access secret is required').max(512),
});
