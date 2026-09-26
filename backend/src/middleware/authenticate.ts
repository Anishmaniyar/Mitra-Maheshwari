import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../shared/auth/jwt.js';
import { AppError } from '../shared/errors/appError.js';
import type { AuthUser } from '../shared/types/auth.types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Authentication only: read access token → verify JWT → validate required
// claims → attach req.user → next(). No business/resource authorization.
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Unauthorized: missing token', 401);
  }

  const token = header.slice('Bearer '.length);

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded.sub || !decoded.role || !decoded.familyId || !decoded.jti) {
      throw new AppError('Unauthorized: invalid token', 401);
    }
    req.user = {
      memberId: decoded.sub,
      role: decoded.role,
      familyId: decoded.familyId,
      isFamilyHead: decoded.isFamilyHead === true,
      jti: decoded.jti,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Unauthorized: invalid token', 401);
  }
};
