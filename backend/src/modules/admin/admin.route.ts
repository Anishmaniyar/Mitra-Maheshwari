import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as AdminSchema from './admin.schema.js';
import * as AdminController from './admin.controller.js';

const adminRouter = Router();

adminRouter.use(authenticate, authorize('ADMIN'));

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
  validateRequest({ params: AdminSchema.registrationIdParamsSchema }),
  AdminController.approveRegistrationController,
);

adminRouter.post(
  '/registrations/:id/reject',
  validateRequest({ params: AdminSchema.registrationIdParamsSchema }),
  AdminController.rejectRegistrationController,
);

adminRouter.get(
  '/members',
  validateRequest({ query: AdminSchema.membersQuerySchema }),
  AdminController.listMembersController,
);

adminRouter.get(
  '/members/:memberId',
  validateRequest({ params: AdminSchema.memberIdParamsSchema }),
  AdminController.getMemberController,
);

adminRouter.patch(
  '/members/:memberId',
  validateRequest({
    params: AdminSchema.memberIdParamsSchema,
    body: AdminSchema.updateMemberSchema,
  }),
  AdminController.updateMemberController,
);

adminRouter.patch(
  '/members/:memberId/status',
  validateRequest({
    params: AdminSchema.memberIdParamsSchema,
    body: AdminSchema.updateMemberStatusSchema,
  }),
  AdminController.updateMemberStatusController,
);

adminRouter.get(
  '/families',
  validateRequest({ query: AdminSchema.familiesQuerySchema }),
  AdminController.listFamiliesController,
);

adminRouter.get(
  '/families/:familyId',
  validateRequest({ params: AdminSchema.familyIdParamsSchema }),
  AdminController.getFamilyController,
);

adminRouter.patch(
  '/families/:familyId',
  validateRequest({
    params: AdminSchema.familyIdParamsSchema,
    body: AdminSchema.updateFamilySchema,
  }),
  AdminController.updateFamilyController,
);

export default adminRouter;
