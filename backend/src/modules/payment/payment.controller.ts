import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import * as PaymentService from './payment.service.js';

const requireUser = (req: Request): string => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }
  return req.user.memberId;
};

export const createOrderController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await PaymentService.createOrder(requireUser(req));

    return res.status(201).json({
      message: 'Payment order created successfully',
      status: 'success',
      data: result,
    });
  },
);

export const listPaymentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await PaymentService.listPayments(requireUser(req));

    return res.status(200).json({
      message: 'Payments fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const getPaymentController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await PaymentService.getPayment(
      requireUser(req),
      (req.params as { id: string }).id,
    );

    return res.status(200).json({
      message: 'Payment fetched successfully',
      status: 'success',
      data: result,
    });
  },
);
