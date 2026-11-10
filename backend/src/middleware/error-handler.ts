import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Prisma unique constraint violation
  if ('code' in err && (err as { code?: string }).code === 'P2002') {
    const meta = (err as { meta?: { target?: string[] } }).meta;
    const fields = meta?.target ? meta.target.join(', ') : 'field';
    sendError(res, 409, 'DUPLICATE_RESOURCE', `A record with this ${fields} already exists.`);
    return;
  }

  // Prisma record not found
  if ('code' in err && (err as { code?: string }).code === 'P2025') {
    sendError(res, 404, 'NOT_FOUND', 'Requested resource was not found.');
    return;
  }

  console.error('Unhandled Application Error:', err);

  const message = env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message;
  const details = env.NODE_ENV === 'development' ? err.stack : undefined;

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', message, details);
}
