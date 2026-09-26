import { z } from 'zod';

const mobileSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number');

const nameSchema = (field: string) =>
  z.string().trim().min(1, `${field} is required`).max(100);

export const completeRegistrationSchema = z.object({
  mobile: mobileSchema,
  firstName: nameSchema('First name'),
  middleName: z.string().trim().max(100).optional(),
  lastName: nameSchema('Last name'),
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
});

export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;
