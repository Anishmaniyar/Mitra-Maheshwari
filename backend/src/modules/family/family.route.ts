import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as FamilySchema from './family.schema.js';
import * as FamilyController from './family.controller.js';

const familyRouter = Router();

familyRouter.get(
  '/',
  authenticate,
  authorize('MEMBER'),
  FamilyController.getFamilyController,
);

familyRouter.get(
  '/members/:memberId',
  authenticate,
  authorize('MEMBER'),
  validateRequest({ params: FamilySchema.memberIdParamsSchema }),
  FamilyController.getFamilyMemberController,
);

familyRouter.post(
  '/invitations',
  authenticate,
  authorize('MEMBER'),
  validateRequest(FamilySchema.createInvitationSchema),
  FamilyController.createInvitationController,
);

familyRouter.get(
  '/invitations',
  authenticate,
  authorize('MEMBER'),
  FamilyController.listInvitationsController,
);

familyRouter.delete(
  '/invitations/:id',
  authenticate,
  authorize('MEMBER'),
  validateRequest({ params: FamilySchema.invitationIdParamsSchema }),
  FamilyController.cancelInvitationController,
);

familyRouter.delete(
  '/members/:memberId',
  authenticate,
  authorize('MEMBER'),
  validateRequest({ params: FamilySchema.memberIdParamsSchema }),
  FamilyController.removeFamilyMemberController,
);

familyRouter.patch(
  '/members/:memberId',
  authenticate,
  authorize('MEMBER'),
  validateRequest({
    params: FamilySchema.memberIdParamsSchema,
    body: FamilySchema.updateFamilyMemberSchema,
  }),
  FamilyController.updateFamilyMemberController,
);

// Public invitation link routes: the invited person is not authenticated yet.
// The unguessable token is the access mechanism; OTP proof is enforced at accept.
familyRouter.get(
  '/invitations/:token',
  validateRequest({ params: FamilySchema.invitationTokenParamsSchema }),
  FamilyController.validateInvitationController,
);

familyRouter.post(
  '/invitations/:token/accept',
  validateRequest({
    params: FamilySchema.invitationTokenParamsSchema,
    body: FamilySchema.acceptInvitationSchema,
  }),
  FamilyController.acceptInvitationController,
);

export default familyRouter;
