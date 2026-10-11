import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors/appError.js';

// Central error handler. Registered last in app.ts.
// Never leaks stack traces, database errors, or secrets.
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (res.headersSent) {
    _next(err);
    return;
  }

  // Body-parser failures (malformed JSON, oversized payloads, bad charset).
  // These are not AppErrors, so they would otherwise surface as 500s; their
  // raw messages may quote request bytes, so use constant safe messages.
  const bodyError = err as Error & { status?: number; type?: string };
  if (typeof bodyError.type === 'string' && bodyError.type.startsWith('entity.')) {
    if (bodyError.type === 'entity.too.large') {
      res.status(413).json({
        status: 'error',
        message: 'Request body too large',
      });
      return;
    }
    res.status(400).json({
      status: 'error',
      message: 'Invalid request body',
    });
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    status: 'error',
    message,
  });
};
