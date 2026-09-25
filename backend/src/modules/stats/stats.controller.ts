import type { Request, Response } from "express";
import { asyncHandler, ok } from "../../utils/http";
import { getCommunityStats } from "./stats.service";

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await getCommunityStats());
});
