import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/http";
import { logger } from "../utils/logger";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found.` },
  });
}

/** Centralized error handler: AppError -> mapped response, everything else -> 500. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Unable to process the request" },
  });
}