import { z } from "zod";

export const addMemberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  middleName: z.string().trim().max(100).nullable().optional(),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  mobile: z.string().trim().min(10, "Enter a valid mobile number").max(15),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).nullable().optional(),
  age: z.number().int().min(1, "Age must be between 1 and 120").max(120).nullable().optional(),
  occupation: z.string().trim().max(100).nullable().optional(),
  area: z.string().trim().max(200).nullable().optional(),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;