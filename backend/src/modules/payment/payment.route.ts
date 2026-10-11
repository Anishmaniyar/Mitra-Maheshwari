import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { paymentOrderUserLimiter } from '../../middleware/rateLimit.js';
import * as PaymentSchema from './payment.schema.js';
import * as PaymentController from './payment.controller.js';

const paymentRouter = Router();

paymentRouter.post(
  '/order',
  authenticate,
  authorize('MEMBER'),
  paymentOrderUserLimiter,
  validateRequest(PaymentSchema.createOrderSchema),
  PaymentController.createOrderController,
);

paymentRouter.post(
  '/verify',
  authenticate,
  authorize('MEMBER'),
  validateRequest(PaymentSchema.verifyPaymentSchema),
  PaymentController.verifyPaymentController,
);

// No user-facing rate limit here by design: legitimate provider retries
// must never be blocked. Abuse protection is signature verification +
// idempotent transitions, plus infrastructure-level controls.
paymentRouter.post(
  '/webhook/razorpay',
  PaymentController.razorpayWebhookController,
);

paymentRouter.get(
  '/',
  authenticate,
  authorize('MEMBER'),
  PaymentController.listPaymentsController,
);

paymentRouter.get(
  '/:id',
  authenticate,
  authorize('MEMBER'),
  validateRequest({ params: PaymentSchema.paymentIdParamsSchema }),
  PaymentController.getPaymentController,
);

export default paymentRouter;
