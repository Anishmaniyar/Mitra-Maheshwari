import type { CookieOptions, Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AuthService from './auth.service.js';
import * as DevAdminService from './devAdmin.service.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

// Refresh-cookie policy (exported for tests): HTTP-only always; Secure in
// production only (local development is plain http); SameSite=Lax so the
// cookie is withheld on cross-site POSTs, which is what makes the
// cookie-based refresh endpoint CSRF-safe without an extra token — the
// access token that actually authorizes API calls travels in the
// Authorization header, never in a cookie. Name, path, and lifetime
// behavior are part of the client contract and intentionally unchanged.
export const buildRefreshCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: maxAgeMs,
});

export const buildClearedRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

const refreshCookieOptions = buildRefreshCookieOptions;

const clearedRefreshCookieOptions = buildClearedRefreshCookieOptions;

export const requestOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AuthService.requestOtp(req.body);

    return res.status(200).json({
      message: 'OTP sent successfully',
      status: 'success',
      data: result,
    });
  },
);

const VERIFY_MESSAGES: Record<AuthService.NextAction, string> = {
  LOGGED_IN: 'Logged in successfully',
  COMPLETE_REGISTRATION: 'OTP verified successfully',
  AWAITING_APPROVAL: 'OTP verified successfully',
  CONTACT_SUPPORT: 'OTP verified successfully',
};

export const verifyOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AuthService.verifyOtp(req.body);

    // A session (and its refresh cookie) exists only for approved logins.
    if (result.nextAction === 'LOGGED_IN' && result.refreshToken) {
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        refreshCookieOptions(AuthService.getRefreshCookieMaxAgeMs()),
      );
    }

    return res.status(200).json({
      message: VERIFY_MESSAGES[result.nextAction],
      status: 'success',
      data: {
        verified: result.verified,
        accountStatus: result.accountStatus,
        nextAction: result.nextAction,
        ...(result.accessToken ? { accessToken: result.accessToken } : {}),
        ...(result.member ? { member: result.member } : {}),
      },
    });
  },
);

export const refreshController = asyncHandler(
  async (req: Request, res: Response) => {
    const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!presentedToken) {
      throw new AppError('Refresh token missing', 401);
    }

    const result = await AuthService.refreshSession(presentedToken);

    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      refreshCookieOptions(AuthService.getRefreshCookieMaxAgeMs()),
    );

    return res.status(200).json({
      message: 'Session refreshed successfully',
      status: 'success',
      data: {
        accessToken: result.accessToken,
      },
    });
  },
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await AuthService.logout(presentedToken);

    res.clearCookie(REFRESH_COOKIE_NAME, clearedRefreshCookieOptions());

    return res.status(200).json({
      message: 'Logged out successfully',
      status: 'success',
      data: null,
    });
  },
);

export const devAdminLoginController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await DevAdminService.devAdminLogin();

    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      refreshCookieOptions(AuthService.getRefreshCookieMaxAgeMs()),
    );

    return res.status(200).json({
      message: 'Logged in successfully',
      status: 'success',
      data: {
        accessToken: result.accessToken,
        member: result.member,
      },
    });
  },
);

export const getMeController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const result = await AuthService.getMe(req.user.memberId);

    return res.status(200).json({
      message: 'Member fetched successfully',
      status: 'success',
      data: result,
    });
  },
);
