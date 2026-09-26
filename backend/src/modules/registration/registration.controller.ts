import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import * as RegistrationService from './registration.service.js';

export const findCandidatesController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await RegistrationService.findCandidates(
      req.query as unknown as { firstName: string; lastName: string },
    );

    return res.status(200).json({
      message: 'Candidates fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const completeRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await RegistrationService.completeRegistration(req.body);

    return res.status(201).json({
      message: 'Registration submitted successfully. Pending admin approval',
      status: 'success',
      data: result,
    });
  },
);
