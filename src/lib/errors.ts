import { ZodError } from 'zod'

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'EMAIL_TAKEN'
  | 'PHONE_TAKEN'
  | 'ACCOUNT_LOCKED'
  | 'EMAIL_NOT_VERIFIED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'MFA_REQUIRED'
  | 'MFA_INVALID'
  | 'CSRF_INVALID'
  | 'SESSION_EXPIRED'
  | 'PAYMENT_FAILED'
  | 'INSUFFICIENT_STOCK'
  | 'IDEMPOTENCY_CONFLICT'
  | 'UNPROCESSABLE'
  | 'INTERNAL_ERROR'

export interface AppErrorOptions {
  status?: number
  code?: ErrorCode
  details?: unknown
  cause?: unknown
  /** Safe to show to the end user. Defaults to true for 4xx errors. */
  expose?: boolean
}

export class AppError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details?: unknown
  readonly expose: boolean

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.name = 'AppError'
    this.status = options.status ?? 500
    this.code = options.code ?? 'INTERNAL_ERROR'
    this.details = options.details
    this.expose = options.expose ?? this.status < 500
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The submitted data is invalid.', details?: unknown) {
    super(message, { status: 422, code: 'VALIDATION_ERROR', details })
    this.name = 'ValidationError'
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Please sign in to continue.') {
    super(message, { status: 401, code: 'UNAUTHENTICATED' })
    this.name = 'UnauthenticatedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, { status: 403, code: 'FORBIDDEN' })
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super(message, { status: 404, code: 'NOT_FOUND' })
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'The resource is in a conflicting state.', details?: unknown) {
    super(message, { status: 409, code: 'CONFLICT', details })
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', retryAfterSeconds?: number) {
    super(message, {
      status: 429,
      code: 'RATE_LIMITED',
      details: retryAfterSeconds ? { retryAfterSeconds } : undefined,
    })
    this.name = 'RateLimitError'
  }
}

export class InsufficientStockError extends AppError {
  constructor(
    message = 'One or more items are no longer available in the requested quantity.',
    details?: unknown,
  ) {
    super(message, { status: 409, code: 'INSUFFICIENT_STOCK', details })
    this.name = 'InsufficientStockError'
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(message = 'This request was already processed with different parameters.') {
    super(message, { status: 409, code: 'IDEMPOTENCY_CONFLICT' })
    this.name = 'IdempotencyConflictError'
  }
}

export class EmailTakenError extends AppError {
  constructor(message = 'An account with this email already exists.') {
    super(message, { status: 409, code: 'EMAIL_TAKEN' })
    this.name = 'EmailTakenError'
  }
}

export class PhoneTakenError extends AppError {
  constructor(message = 'An account with this phone number already exists.') {
    super(message, { status: 409, code: 'PHONE_TAKEN' })
    this.name = 'PhoneTakenError'
  }
}

export class AccountLockedError extends AppError {
  constructor(message = 'Too many unsuccessful attempts. Please try again later.') {
    super(message, { status: 429, code: 'ACCOUNT_LOCKED' })
    this.name = 'AccountLockedError'
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message = 'Please verify your email address before signing in.') {
    super(message, { status: 403, code: 'EMAIL_NOT_VERIFIED' })
    this.name = 'EmailNotVerifiedError'
  }
}

export class OtpError extends AppError {
  constructor(code: 'OTP_INVALID' | 'OTP_EXPIRED', message?: string) {
    super(
      message ?? (code === 'OTP_EXPIRED' ? 'This code has expired.' : 'That code is not valid.'),
      {
        status: code === 'OTP_EXPIRED' ? 410 : 400,
        code,
      },
    )
    this.name = 'OtpError'
  }
}

export class MfaInvalidError extends AppError {
  constructor(message = 'That authentication code is not valid.') {
    super(message, { status: 400, code: 'MFA_INVALID' })
    this.name = 'MfaInvalidError'
  }
}

export class CsrfError extends AppError {
  constructor(message = 'The request could not be verified. Please refresh and try again.') {
    super(message, { status: 403, code: 'CSRF_INVALID' })
    this.name = 'CsrfError'
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = 'Your session has expired. Please sign in again.') {
    super(message, { status: 401, code: 'SESSION_EXPIRED' })
    this.name = 'SessionExpiredError'
  }
}

export function fromZodError(
  error: ZodError,
  message = 'The submitted data is invalid.',
): ValidationError {
  return new ValidationError(
    message,
    error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  )
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function toPublicError(error: unknown): {
  code: ErrorCode
  message: string
  details?: unknown
} {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.expose ? error.message : 'Something went wrong. Please try again.',
      details: error.expose ? error.details : undefined,
    }
  }
  return { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' }
}
