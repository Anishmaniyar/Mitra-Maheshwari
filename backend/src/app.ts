import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

export const app = express();

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
