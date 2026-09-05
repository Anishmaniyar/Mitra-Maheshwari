import rateLimit from "express-rate-limit";

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  message?: string;
  /** Key by IP + request body mobile when present (auth endpoints). */
  keyByMobile?: boolean;
}

/**
 * In-memory rate limiting per IP (+ mobile on auth endpoints). Fine for the
 * MVP; the abstraction allows swapping in a shared store (e.g. Redis) later
 * without changing routes.
 */
export function rateLimiter(opts: RateLimitOptions) {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: opts.message ?? "Too many requests. Please try again later.",
      },
    },
    keyGenerator: opts.keyByMobile
      ? (req) => {
          const mobile = (req.body as { mobile?: string } | undefined)?.mobile ?? "unknown";
          return `${req.ip}:${mobile}`;
        }
      : undefined,
  });
}