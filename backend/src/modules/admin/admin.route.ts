import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  authenticateAdmin,
  requireAdminCsrf,
} from '../../middleware/authenticateAdmin.js';
import { adminSessionIpLimiter } from '../../middleware/rateLimit.js';
import * as AdminSchema from './admin.schema.js';
import * as AdminController from './admin.controller.js';

const adminRouter = Router();

// Link exchange: the only unauthenticated admin endpoint. The secret arrives in
// the request body (never a query string) and becomes an HttpOnly cookie.
adminRouter.post(
  '/session',
  adminSessionIpLimiter,
  validateRequest({ body: AdminSchema.adminSessionSchema }),
  AdminController.createAdminSessionController,
);

adminRouter.get(
  '/session',
  authenticateAdmin,
  AdminController.getAdminSessionController,
);

adminRouter.post('/session/logout', AdminController.logoutAdminSessionController);

// Everything below is gated only by the admin-session cookie. Member JWTs are
// intentionally ignored by authenticateAdmin.
adminRouter.use(authenticateAdmin);

adminRouter.get(
  '/registrations',
  validateRequest({ query: AdminSchema.registrationsQuerySchema }),
  AdminController.listRegistrationsController,
);

adminRouter.get(
  '/registrations/:id',
  validateRequest({ params: AdminSchema.registrationIdParamsSchema }),
  AdminController.getRegistrationController,
);

adminRouter.post(
  '/registrations/:id/approve',
  requireAdminCsrf,
  validateRequest({ params: AdminSchema.registrationIdParamsSchema }),
  AdminController.approveRegistrationController,
);

adminRouter.post(
  '/registrations/:id/reject',
  requireAdminCsrf,
  validateRequest({ params: AdminSchema.registrationIdParamsSchema }),
  AdminController.rejectRegistrationController,
);

export default adminRouter;
