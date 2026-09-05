import type { NextFunction, Request, Response } from "express";

type Level = "info" | "warn" | "error";

function ts(): string {
  return new Date().toISOString();
}

function write(level: Level, ...args: unknown[]): void {
  const prefix = `[${ts()}] [${level.toUpperCase()}]`;
  if (level === "error") console.error(prefix, ...args);
  else if (level === "warn") console.warn(prefix, ...args);
  else console.log(prefix, ...args);
}

export const logger = {
  info: (...args: unknown[]): void => {
    // Info-level detail is development noise; production logs warnings/errors only.
    if (process.env.NODE_ENV === "production") return;
    write("info", ...args);
  },
  warn: (...args: unknown[]): void => write("warn", ...args),
  error: (...args: unknown[]): void => write("error", ...args),
};

/** Logs method, path, status and duration for each request (info level). */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
}