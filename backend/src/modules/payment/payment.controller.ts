import type { Request, Response } from "express";
import { asyncHandler, ok, requireMemberId } from "../../utils/http";
import {
  createMembershipPayment,
  handlePaymentWebhook,
  listPayments,
  WEBHOOK_SIGNATURE_HEADER,
} from "./payment.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const payment = await createMembershipPayment(requireMemberId(req));
  ok(res, { payment }, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const payments = await listPayments(requireMemberId(req));
  ok(res, { payments });
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  // Body is a Buffer (express.raw was mounted for this path in app.ts).
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body ?? {});
  const result = await handlePaymentWebhook({
    rawBody,
    signature: req.header(WEBHOOK_SIGNATURE_HEADER),
  });
  ok(res, result);
});