import express, { Express, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { adminRouter, storefrontRouter } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { NotFoundError } from './utils/errors.js';

const app: Express = express();

// Backend request logging (must be first so every request/response is logged)
app.use(requestLogger);

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing
const configuredOrigins = [
  env.STOREFRONT_URL,
  env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5000',
];

const isDevelopment = env.NODE_ENV === 'development';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowedConfigured = configuredOrigins.some(
        (o) => o && o.replace(/\/$/, '') === normalizedOrigin
      );
      const isLocalhost =
        isDevelopment && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);

      if (isAllowedConfigured || isLocalhost) {
        callback(null, true);
      } else {
        // Return false without throwing an unhandled exception
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Static files for uploads fallback
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'furniture-electronics-api',
  });
});

// Isolated API namespaces — no endpoint is shared between the two clients.
app.use('/api/admin/v1', adminRouter);
app.use('/api/storefront/v1', storefrontRouter);

// 404 handler
app.use((_req: Request, _res: Response, next) => {
  next(new NotFoundError('API endpoint not found'));
});

// Global error handler
app.use(errorHandler);

export { app };
