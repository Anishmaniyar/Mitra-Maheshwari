import cookieParser from 'cookie-parser';
import express from 'express';
import { pool } from './config/database.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

export const app = express();

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
app.use('/api/payments/webhook/razorpay', express.raw({ type: 'application/json' }));

app.use(express.json());
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
