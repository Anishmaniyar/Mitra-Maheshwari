import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as AuthSchema from './auth.schema.js';
import * as AuthController from './auth.controller.js';

const authRouter = Router();

authRouter.post(
  '/request-otp',
  validateRequest(AuthSchema.requestOtpSchema),
  AuthController.requestOtpController,
);

authRouter.post(
  '/verify-otp',
  validateRequest(AuthSchema.verifyOtpSchema),
  AuthController.verifyOtpController,
);

authRouter.post('/refresh', AuthController.refreshController);

authRouter.post('/logout', AuthController.logoutController);

authRouter.get('/me', authenticate, AuthController.getMeController);

export default authRouter;
