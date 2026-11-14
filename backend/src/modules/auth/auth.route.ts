import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
  otpRequestIpLimiter,
  otpRequestMobileLimiter,
  otpVerifyIpLimiter,
  otpVerifyMobileLimiter,
  refreshIpLimiter,
} from '../../middleware/rateLimit.js';
import * as AuthSchema from './auth.schema.js';
import * as AuthController from './auth.controller.js';

const authRouter = Router();

// Layered limits: coarse per-IP shield plus tight per-mobile caps. The OTP
// store additionally enforces resend cooldowns, per-mobile resend caps, and
// per-challenge attempt limits.
authRouter.post(
  '/request-otp',
  otpRequestIpLimiter,
  otpRequestMobileLimiter,
  validateRequest(AuthSchema.requestOtpSchema),
  AuthController.requestOtpController,
);

authRouter.post(
  '/verify-otp',
  otpVerifyIpLimiter,
  otpVerifyMobileLimiter,
  validateRequest(AuthSchema.verifyOtpSchema),
  AuthController.verifyOtpController,
);

authRouter.post('/refresh', refreshIpLimiter, AuthController.refreshController);

authRouter.post('/logout', AuthController.logoutController);

authRouter.get('/me', authenticate, AuthController.getMeController);

export default authRouter;
