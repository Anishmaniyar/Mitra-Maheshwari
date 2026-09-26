import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

export const app = express();

// Razorpay webhooks are verified against the raw body, so this route must
// receive express.raw before the JSON parser below consumes the stream.
app.use('/api/payments/webhook/razorpay', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({
    message: 'OK',
    status: 'success',
    data: null,
  });
});

app.use('/api', routes);

app.use(errorHandler);
