import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/appError.js';
import type { Role } from '../shared/types/auth.types.js';

// Role-based authorization only. Usage: authorize('ADMIN').
// Ownership checks (e.g. family head of the same family) belong in services.
export const authorize =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Forbidden', 403);
    }

    next();
  };
