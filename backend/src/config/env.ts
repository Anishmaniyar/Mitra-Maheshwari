import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  DEMO_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  MEMBERSHIP_ANNUAL_FEE_AMOUNT: z.string().default('1100'),
  MEMBERSHIP_CURRENCY: z.string().default('INR'),
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
