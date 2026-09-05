import { Router } from "express";
import { rateLimiter } from "../../middleware/rate-limit.middleware";
import { validate } from "../../middleware/validation.middleware";
import * as authController from "./auth.controller";
import { sendOtpSchema, verifyOtpSchema } from "./auth.validation";

export const authRouter = Router();

// Rate limits are keyed per IP + mobile to slow down OTP abuse.
authRouter.post(
  "/send-otp",
  rateLimiter({ windowMs: 60_000, limit: 5, keyByMobile: true, message: "Too many OTP requests. Please wait a minute." }),
  validate(sendOtpSchema),
  authController.sendOtp,
);

authRouter.post(
  "/resend-otp",
  rateLimiter({ windowMs: 60_000, limit: 5, keyByMobile: true, message: "Too many OTP requests. Please wait a minute." }),
  validate(sendOtpSchema),
  authController.resendOtp,
);

authRouter.post(
  "/verify-otp",
  rateLimiter({ windowMs: 60_000, limit: 10, keyByMobile: true, message: "Too many verification attempts. Please wait a minute." }),
  validate(verifyOtpSchema),
  authController.verifyOtp,
);