import type { NextFunction, Request, Response } from "express";

/** Operational error with an HTTP status and a stable machine-readable code. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Consistent success envelope: { success: true, data } */
export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

/** Wraps async handlers so rejections reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Reads the authenticated member id or throws. */
export function requireMemberId(req: Request<unknown, unknown>): number {
  const memberId = req.auth?.memberId;
  if (!memberId) throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
  return memberId;
}