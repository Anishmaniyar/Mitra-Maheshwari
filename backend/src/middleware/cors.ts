import cors from 'cors';

// CORS allowlist for the browser frontend. Origins come from the validated
// CORS_ALLOWED_ORIGINS configuration (comma-separated, exact match).
// - Requests without an Origin header (curl, server-to-server, Razorpay
//   webhooks) are not CORS requests and are never blocked here.
// - Credentialed refresh-cookie flows only work for explicitly allowed
//   origins (exact ACAO echo + credentials:true, never `*`).
// - Disallowed origins get no ACAO headers, so browsers block the read;
//   preflight included. The API itself stays reachable by non-browsers.

// Split "https://a.example, https://b.example" into a clean origin list.
export const parseAllowedOrigins = (raw: string | undefined): string[] => {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((part) => part.trim().replace(/\/+$/, ''))
    .filter((part) => part.length > 0);
};

const ORIGIN_RE = /^https?:\/\/[^/\s]+(:\d+)?$/;

// Production origins must be https (no paths, no credentials, no wildcards).
// Non-production additionally permits http loopback for local development.
export const assertOriginsForEnv = (
  origins: string[],
  nodeEnv: string,
): void => {
  for (const origin of origins) {
    if (!ORIGIN_RE.test(origin)) {
      throw new Error(
        `Invalid CORS origin "${origin}": must be a bare scheme + host origin`,
      );
    }
    if (nodeEnv === 'production' && !origin.startsWith('https://')) {
      throw new Error(
        `Invalid CORS origin "${origin}": production origins must use https`,
      );
    }
    if (
      nodeEnv !== 'production' &&
      origin.startsWith('http://') &&
      !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)
    ) {
      throw new Error(
        `Invalid CORS origin "${origin}": non-https origins are limited to local loopback`,
      );
    }
  }
};

export const buildCorsMiddleware = (allowedOrigins: string[]) =>
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Cache preflights for 10 minutes to avoid an OPTIONS round trip per call.
    maxAge: 600,
  });
