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

export const verifyPaymentController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };
    const result = await PaymentService.verifyPayment(requireUser(req), {
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    return res.status(200).json({
      message: 'Payment verified successfully',
      status: 'success',
      data: result,
    });
  },
);

// No authentication: the webhook signature is the credential.
// Requires the raw request body — see app.ts (express.raw before express.json).
export const razorpayWebhookController = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'];
    if (typeof signature !== 'string' || !signature) {
      throw new AppError('Missing webhook signature', 400);
    }

    const result = await PaymentService.handleRazorpayWebhook(
      req.body as Buffer,
      signature,
    );

    return res.status(200).json({
      message: 'Webhook received',
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
