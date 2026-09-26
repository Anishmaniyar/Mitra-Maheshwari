import { z } from 'zod';

export const familyIdParamsSchema = z.object({
  familyId: z.string().uuid('Invalid family id'),
});

export const registrationIdParamsSchema = z.object({
  id: z.string().uuid('Invalid registration id'),
});

export const memberIdParamsSchema = z.object({
  memberId: z.string().uuid('Invalid member id'),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const registrationsQuerySchema = paginationQuerySchema.extend({});

export const membersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export const familiesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).optional(),
});

export const updateMemberSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  middleName: z.string().trim().max(100).nullable().optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .nullable()
    .optional(),
  age: z.number().int().min(0).max(130).nullable().optional(),
  occupation: z.string().trim().max(200).nullable().optional(),
  area: z.string().trim().max(200).nullable().optional(),
  panName: z.string().trim().max(200).nullable().optional(),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN number')
    .nullable()
    .optional(),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const updateFamilySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
