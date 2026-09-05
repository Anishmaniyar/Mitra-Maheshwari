import { z } from "zod";

export const matchMemberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  mobile: z.string().trim().min(10, "Enter a valid mobile number").max(15),
});

export const createMemberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  middleName: z.string().trim().max(100).nullable().optional(),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  mobile: z.string().trim().min(10, "Enter a valid mobile number").max(15),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).nullable().optional(),
  age: z.number().int().min(1, "Age must be between 1 and 120").max(120).nullable().optional(),
  occupation: z.string().trim().max(100).nullable().optional(),
  area: z.string().trim().max(200).nullable().optional(),
  panName: z.string().trim().max(100).nullable().optional(),
  panNumber: z
    .string()
    .trim()
    .max(20)
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "PAN must look like ABCDE1234F")
    .nullable()
    .optional(),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100).optional(),
    middleName: z.string().trim().max(100).nullable().optional(),
    lastName: z.string().trim().min(1, "Last name is required").max(100).optional(),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).nullable().optional(),
    age: z.number().int().min(1, "Age must be between 1 and 120").max(120).nullable().optional(),
    occupation: z.string().trim().max(100).nullable().optional(),
    area: z.string().trim().max(200).nullable().optional(),
    panName: z.string().trim().max(100).nullable().optional(),
    panNumber: z
      .string()
      .trim()
      .max(20)
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "PAN must look like ABCDE1234F")
      .nullable()
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

export type MatchMemberInput = z.infer<typeof matchMemberSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;