import type { Request, Response } from "express";
import { asyncHandler, ok } from "../../utils/http";
import * as authService from "./auth.service";
import type { SendOtpInput, VerifyOtpInput } from "./auth.validation";

export const sendOtp = asyncHandler(async (req: Request<unknown, unknown, SendOtpInput>, res: Response) => {
  const result = await authService.sendOtp(req.body);
  ok(res, result);
});

/** Resend is the same flow with its own rate limit. */
export const resendOtp = sendOtp;

export const verifyOtp = asyncHandler(async (req: Request<unknown, unknown, VerifyOtpInput>, res: Response) => {
  const result = await authService.verifyOtp(req.body);
  ok(res, result);
});