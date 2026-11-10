import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limiter.js';
import { NotFoundError } from './utils/errors.js';

const app: Express = express();

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing
const allowedOrigins = [env.STOREFRONT_URL, env.ADMIN_URL, 'http://localhost:5173', 'http://localhost:5174'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Rate Limiter for general endpoints
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'furniture-electronics-api',
  });
});

// API routes
app.use('/api/v1', apiRouter);

// 404 handler
app.use((_req: Request, _res: Response, next) => {
  next(new NotFoundError('API endpoint not found'));
});

// Global error handler
app.use(errorHandler);

export { app };
