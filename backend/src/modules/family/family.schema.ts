import { z } from 'zod';

export const memberIdParamsSchema = z.object({
  memberId: z.string().uuid('Invalid member id'),
});

export const invitationIdParamsSchema = z.object({
  id: z.string().uuid('Invalid invitation id'),
});

export const createInvitationSchema = z.object({
  inviteeName: z.string().trim().min(1, 'Invitee name is required').max(200),
  inviteeMobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number')
    .optional(),
  inviteeEmail: z.string().trim().email('Invalid email').max(254).optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
