import type { CookieOptions, Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AdminService from './admin.service.js';
import * as AdminAuthService from './adminAuth.service.js';

// Admin-session cookie policy (exported for tests): HttpOnly always, Secure in
// production, SameSite=Strict, and scoped to the admin API. The secret itself
// never reaches the browser; only this short-lived signed session token does.
export const buildAdminSessionCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/admin',
  maxAge: maxAgeMs,
});

export const buildClearedAdminSessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/admin',
});

export const createAdminSessionController = asyncHandler(
  async (req: Request, res: Response) => {
    const { secret } = req.body as { secret: string };
    const token = AdminAuthService.exchangeAdminLink(secret);

    res.cookie(
      AdminAuthService.ADMIN_SESSION_COOKIE,
      token,
      buildAdminSessionCookieOptions(AdminAuthService.getAdminSessionMaxAgeMs()),
    );

    return res.status(200).json({
      message: 'Admin session established',
      status: 'success',
      data: { authenticated: true },
    });
  },
);

export const getAdminSessionController = asyncHandler(
  async (_req: Request, res: Response) => {
    return res.status(200).json({
      message: 'Admin session is active',
      status: 'success',
      data: { authenticated: true },
    });
  },
);

export const logoutAdminSessionController = asyncHandler(
  async (_req: Request, res: Response) => {
    res.clearCookie(
      AdminAuthService.ADMIN_SESSION_COOKIE,
      buildClearedAdminSessionCookieOptions(),
    );

    return res.status(200).json({
      message: 'Admin session ended',
      status: 'success',
      data: null,
    });
  },
);

export const listRegistrationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as { limit: number; offset: number };
    const result = await AdminService.listRegistrations(query.limit, query.offset);

    return res.status(200).json({
      message: 'Registrations fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const getRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AdminService.getRegistration(
      (req.params as { id: string }).id,
    );

    return res.status(200).json({
      message: 'Registration fetched successfully',
      status: 'success',
      data: result,
    });
  },
);

export const approveRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.adminSession) {
      throw new AppError('Unauthorized', 401);
    }

    const result = await AdminService.approveRegistration(
      (req.params as { id: string }).id,
    );

    return res.status(200).json({
      message: 'Registration approved successfully',
      status: 'success',
      data: result,
    });
  },
);

export const rejectRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.adminSession) {
      throw new AppError('Unauthorized', 401);
    }

    const result = await AdminService.rejectRegistration(
      (req.params as { id: string }).id,
    );

    return res.status(200).json({
      message: 'Registration rejected successfully',
      status: 'success',
      data: result,
    });
  },
);
