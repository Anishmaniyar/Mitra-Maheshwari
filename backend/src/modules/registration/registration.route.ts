import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  candidatesIpLimiter,
  registrationCompleteLimiter,
} from '../../middleware/rateLimit.js';
import * as RegistrationSchema from './registration.schema.js';
import * as RegistrationController from './registration.controller.js';

const registrationRouter = Router();

// Candidate search is public and name-based: limit it so it cannot be used
// to enumerate the directory at scale.
registrationRouter.get(
  '/candidates',
  candidatesIpLimiter,
  validateRequest({ query: RegistrationSchema.candidateQuerySchema }),
  RegistrationController.findCandidatesController,
);

registrationRouter.post(
  '/complete',
  registrationCompleteLimiter,
  validateRequest(RegistrationSchema.completeRegistrationSchema),
  RegistrationController.completeRegistrationController,
);

export default registrationRouter;
