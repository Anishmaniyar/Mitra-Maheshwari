import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pool } from './config/database.js';
import { env } from './config/env.js';
import { buildCorsMiddleware, parseAllowedOrigins } from './middleware/cors.js';
import { errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

export const app = express();

// req.ip (used for rate-limit keys) honors X-Forwarded-For only when the
// hosting proxy is explicitly trusted via TRUST_PROXY. Default: direct
// connections only, forwarded headers ignored.
export const parseTrustProxy = (value: string): boolean | number => {
  if (value === 'true') {
    return true;
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  return false;
};
app.set('trust proxy', parseTrustProxy(env.TRUST_PROXY));

// Baseline security headers. crossOriginResourcePolicy is disabled: this is
// a JSON API consumed cross-origin by the approved frontend, and the
// same-origin-only policy would block those reads. TLS itself terminates at
// the hosting proxy/LB; HSTS below tells browsers to keep using https.
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

// Exact-match allowlist from CORS_ALLOWED_ORIGINS (credentials enabled for
// the refresh-cookie flow). Non-browser requests carry no Origin header and
// pass through; disallowed browser origins get no ACAO headers.
app.use(buildCorsMiddleware(parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS)));

// Dev-only request log so terminal shows every incoming API call + status.
if (env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      console.log(
        `${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - started}ms)`,
      );
    });
    next();
  });
}

// Razorpay webhooks are verified against the raw body, so this route must
// receive express.raw before the JSON parser below consumes the stream.
app.use(
  '/api/payments/webhook/razorpay',
  express.raw({ type: 'application/json', limit: env.JSON_BODY_LIMIT }),
);

app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  let db = 'down';
  try {
    await pool.query('SELECT 1');
    db = 'up';
  } catch {
    db = 'down';
  }

  res.status(200).json({
    message: 'OK',
    status: 'success',
    data: {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      db,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api', routes);

app.use(errorHandler);
