import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import * as StatsService from './stats.service.js';

export const getCommunityStatsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await StatsService.getCommunityStats();

    return res.status(200).json({
      message: 'Community stats fetched successfully',
      status: 'success',
      data: result,
    });
  },
);
