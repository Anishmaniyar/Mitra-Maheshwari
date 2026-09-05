import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt";
import { AppError } from "../utils/http";

/**
 * Authenticates the bearer JWT and attaches { accountId, memberId } to the
 * request. Family/role checks happen in the services, never from client input.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");

  const payload = verifyAuthToken(token);
  if (!payload) {
    throw new AppError(401, "UNAUTHENTICATED", "Session expired or invalid. Please verify your mobile again.");
  }

  req.auth = { accountId: payload.accountId, memberId: payload.memberId };
  next();
}