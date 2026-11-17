import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Logs one line per completed HTTP request with method, path, status and duration.
 * Query strings are intentionally omitted so tokens/credentials are never logged.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();
  const method = req.method;
  const path = req.originalUrl.split('?')[0] || '/';

  res.on('finish', () => {
    const durationMs = (Number(process.hrtime.bigint() - startedAt) / 1e6).toFixed(1);
    const message = `${method} ${path} ${res.statusCode} ${durationMs}ms`;

    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
}
