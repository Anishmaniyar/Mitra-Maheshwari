import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/appError.js';
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from '../modules/admin/adminAuth.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminSession?: { authenticated: true };
    }
  }
}

// Admin authorization is deliberately separate from member authentication:
// only the HttpOnly admin-session cookie is considered. A member Bearer token
// (or a valid member session) can never satisfy this middleware.
export const authenticateAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE];
  if (!verifyAdminSessionToken(typeof token === 'string' ? token : undefined)) {
    throw new AppError('Unauthorized: invalid admin session', 401);
  }

  req.adminSession = { authenticated: true };
  next();
};

// SameSite=Strict already blocks cross-site cookies; this custom header adds a
// second, explicit CSRF guard for state-changing admin requests. Cross-site
// forms cannot set custom headers, and the CORS allowlist governs preflights.
export const requireAdminCsrf = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.get('x-admin-csrf') !== '1') {
    throw new AppError('Forbidden: missing admin CSRF header', 403);
  }
  next();
};
