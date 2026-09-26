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

export const invitationTokenParamsSchema = z.object({
  token: z.string().min(1, 'Invalid invitation token').max(128),
});

const memberProfileFields = {
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  middleName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  age: z.number().int().min(0).max(130).optional(),
  occupation: z.string().trim().max(200).optional(),
  area: z.string().trim().max(200).optional(),
  panName: z.string().trim().max(200).optional(),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN number')
    .optional(),
};

export const acceptInvitationSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number'),
  ...memberProfileFields,
});

export const updateFamilyMemberSchema = z.object({
  firstName: memberProfileFields.firstName.optional(),
  middleName: memberProfileFields.middleName,
  lastName: z.string().trim().min(1).max(100).optional(),
  bloodGroup: memberProfileFields.bloodGroup,
  age: memberProfileFields.age,
  occupation: memberProfileFields.occupation,
  area: memberProfileFields.area,
  panName: memberProfileFields.panName,
  panNumber: memberProfileFields.panNumber,
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;
