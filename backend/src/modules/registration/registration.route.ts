import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.middleware.js';
import * as RegistrationSchema from './registration.schema.js';
import * as RegistrationController from './registration.controller.js';

const registrationRouter = Router();

registrationRouter.post(
  '/complete',
  validateRequest(RegistrationSchema.completeRegistrationSchema),
  RegistrationController.completeRegistrationController,
);

export default registrationRouter;
