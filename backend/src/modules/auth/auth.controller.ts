import type { CookieOptions, Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import * as AuthService from './auth.service.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

const refreshCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: maxAgeMs,
});

const clearedRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

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

export const verifyOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AuthService.verifyOtp(req.body);

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
