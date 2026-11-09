import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors: any = undefined;

  // Handle Zod validation error
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error occurred';
    errors = err.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle Prisma Known Request Errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `Unique constraint violation on field: ${err.meta?.target || 'unknown'}`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record not found';
  }

  // Avoid leaking server internals in production
  const responsePayload: Record<string, any> = {
    success: false,
    message,
  };

  if (errors) {
    responsePayload.errors = errors;
  }

  if (process.env.NODE_ENV === 'development') {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
