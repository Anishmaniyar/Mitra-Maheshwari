import { Router } from "express";
import { rateLimiter } from "../../middleware/rate-limit.middleware";
import * as statsController from "./stats.controller";

export const statsRouter = Router();

// Public: aggregate community counters shown on the marketing pages.
statsRouter.get(
  "/",
  rateLimiter({ windowMs: 60_000, limit: 60, message: "Too many requests. Please slow down." }),
  statsController.getStats,
);
