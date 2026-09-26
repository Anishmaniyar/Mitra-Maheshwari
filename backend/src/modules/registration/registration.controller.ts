import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import * as RegistrationService from './registration.service.js';

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
