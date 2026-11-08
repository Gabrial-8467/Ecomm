import { z } from 'zod'

/**
 * Server-side environment contract.
 *
 * Validation is intentionally strict in production and permissive in
 * development so that a fresh clone can boot without paid integrations.
 * `getEnv()` is lazy so importing a module during `next build` does not
 * require runtime secrets that are only injected at deploy time.
 */

const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true')

const intFromString = (min: number, max: number) => z.coerce.number().int().min(min).max(max)

/** Treat blank values in .env files as absent rather than invalid. */
const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
)

const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().url().optional(),
)

const optionalEmail = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().email().optional(),
)

const isBuildPhase = () =>
  process.env.NEXT_PHASE === 'phase-production-build' || process.env.SKIP_ENV_VALIDATION === '1'

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_NAME: z.string().min(1).default('CasaCircuit'),
  DEFAULT_CURRENCY: z.string().length(3).default('INR'),
  DEFAULT_TIMEZONE: z.string().min(1).default('Asia/Kolkata'),
  SUPPORT_EMAIL: z.string().email(),

  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: optionalString,
  SHADOW_DATABASE_URL: optionalString,

  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  REDIS_PREFIX: z.string().min(1).default('casacircuit'),
  REDIS_REQUIRED: booleanFromString.default(true),

  SESSION_COOKIE_NAME: z.string().min(1).default('cc_session'),
  STAFF_SESSION_COOKIE_NAME: z.string().min(1).default('cc_staff_session'),
  SESSION_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
  OTP_PEPPER: z.string().min(32),
  MFA_ENCRYPTION_KEY: z.string().min(32),
  TRUSTED_ORIGINS: z.string().default('http://localhost:3000'),

  BOOTSTRAP_ADMIN_EMAIL: optionalEmail,
  BOOTSTRAP_ADMIN_PASSWORD: optionalString,
  BOOTSTRAP_ADMIN_NAME: optionalString,

  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  RAZORPAY_MODE: z.enum(['test', 'live']).default('test'),

  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().min(1),

  SMS_PROVIDER: z.enum(['console', 'msg91', 'twilio']).default('console'),
  SMS_SENDER_ID: optionalString,
  MSG91_AUTH_KEY: optionalString,
  MSG91_TEMPLATE_ID: optionalString,
  TWILIO_ACCOUNT_SID: optionalString,
  TWILIO_AUTH_TOKEN: optionalString,
  TWILIO_FROM: optionalString,

  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  S3_REGION: z.string().default('ap-south-1'),
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_ENDPOINT: optionalUrl,
  S3_PUBLIC_BASE_URL: optionalUrl,
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  MEDIA_HOSTNAME: optionalString,

  SHIPPING_PROVIDER: z.enum(['mock', 'shiprocket', 'delhivery']).default('mock'),
  SHIPROCKET_EMAIL: optionalString,
  SHIPROCKET_PASSWORD: optionalString,
  SHIPROCKET_WEBHOOK_SECRET: optionalString,
  DELHIVERY_API_KEY: optionalString,
  DELHIVERY_WEBHOOK_SECRET: optionalString,

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('json'),
  SENTRY_DSN: optionalUrl,

  CART_MAX_QUANTITY_PER_LINE: intFromString(1, 100).default(10),
  RESERVATION_TTL_MINUTES: intFromString(1, 60).default(15),
  COD_MAX_ORDER_VALUE: intFromString(0, 1_000_000).default(50_000),
  FREE_SHIPPING_THRESHOLD: intFromString(0, 10_000_000).default(4_999),
  STANDARD_SHIPPING_FEE: intFromString(0, 100_000).default(99),
  COD_FEE: intFromString(0, 10_000).default(0),
  ORDER_ACCESS_TTL_DAYS: intFromString(1, 365).default(30),
  DEFAULT_RETURN_WINDOW_DAYS: intFromString(0, 365).default(7),
  ADMIN_MFA_REQUIRED: booleanFromString.default(true),

  // Authentication policy. Defaults follow docs/05-SECURITY.md.
  PASSWORD_MIN_LENGTH: intFromString(8, 128).default(10),
  PASSWORD_STAFF_MIN_LENGTH: intFromString(10, 128).default(12),
  AUTH_MAX_FAILED_LOGINS: intFromString(3, 20).default(5),
  AUTH_LOCK_MINUTES: intFromString(1, 1440).default(15),
  SESSION_IDLE_CUSTOMER_DAYS: intFromString(1, 90).default(7),
  SESSION_ABSOLUTE_CUSTOMER_DAYS: intFromString(1, 365).default(30),
  SESSION_IDLE_STAFF_MINUTES: intFromString(5, 1440).default(30),
  SESSION_ABSOLUTE_STAFF_HOURS: intFromString(1, 72).default(12),
  EMAIL_VERIFY_TTL_HOURS: intFromString(1, 168).default(24),
  PASSWORD_RESET_TTL_MINUTES: intFromString(5, 1440).default(30),
  OTP_TTL_MINUTES: intFromString(1, 30).default(5),
  OTP_MAX_ATTEMPTS: intFromString(1, 20).default(5),
  MFA_CHALLENGE_TTL_MINUTES: intFromString(1, 30).default(5),
})

function isLoopbackUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}

function refinement(data: z.infer<typeof baseSchema>, ctx: z.RefinementCtx) {
  const production = data.NODE_ENV === 'production' && !isBuildPhase()

  if (production && !data.REDIS_REQUIRED) {
    ctx.addIssue({
      code: 'custom',
      path: ['REDIS_REQUIRED'],
      message: 'Redis is mandatory in production (rate limiting, queues, OTP).',
    })
  }

  if (data.EMAIL_PROVIDER === 'resend' && !data.RESEND_API_KEY) {
    ctx.addIssue({
      code: 'custom',
      path: ['RESEND_API_KEY'],
      message: 'Required when EMAIL_PROVIDER=resend',
    })
  }
  if (data.SMS_PROVIDER === 'msg91' && (!data.MSG91_AUTH_KEY || !data.MSG91_TEMPLATE_ID)) {
    ctx.addIssue({
      code: 'custom',
      path: ['MSG91_AUTH_KEY'],
      message: 'MSG91 auth key and template ID are required',
    })
  }
  if (
    data.SMS_PROVIDER === 'twilio' &&
    (!data.TWILIO_ACCOUNT_SID || !data.TWILIO_AUTH_TOKEN || !data.TWILIO_FROM)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['TWILIO_ACCOUNT_SID'],
      message: 'Twilio credentials are required',
    })
  }
  if (
    data.STORAGE_PROVIDER === 's3' &&
    (!data.S3_BUCKET || !data.S3_ACCESS_KEY_ID || !data.S3_SECRET_ACCESS_KEY)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['S3_BUCKET'],
      message: 'S3 bucket and credentials are required',
    })
  }
  if (
    data.STORAGE_PROVIDER === 'cloudinary' &&
    (!data.CLOUDINARY_CLOUD_NAME || !data.CLOUDINARY_API_KEY || !data.CLOUDINARY_API_SECRET)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['CLOUDINARY_CLOUD_NAME'],
      message: 'Cloudinary credentials are required',
    })
  }

  if (production) {
    if (!isLoopbackUrl(data.APP_URL) && new URL(data.APP_URL).protocol !== 'https:') {
      ctx.addIssue({
        code: 'custom',
        path: ['APP_URL'],
        message: 'APP_URL must use HTTPS in production',
      })
    }
    if (
      !data.TRUSTED_ORIGINS.split(',').every((origin) => {
        const trimmed = origin.trim()
        return trimmed.startsWith('https://') || isLoopbackUrl(trimmed)
      })
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['TRUSTED_ORIGINS'],
        message:
          'Every trusted origin must use HTTPS in production (loopback hosts are allowed for local containers)',
      })
    }
    if (!data.RAZORPAY_KEY_ID || !data.RAZORPAY_KEY_SECRET || !data.RAZORPAY_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['RAZORPAY_KEY_ID'],
        message: 'Razorpay keys and webhook secret are required in production',
      })
    }
    if (!data.DIRECT_DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DIRECT_DATABASE_URL'],
        message: 'DIRECT_DATABASE_URL is required in production migrations',
      })
    }
  }
}

const schema = baseSchema.superRefine(refinement)

export type Env = z.infer<typeof baseSchema> & {
  trustedOrigins: string[]
  isProduction: boolean
  isDevelopment: boolean
  isTest: boolean
}

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached

  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${details}`)
  }

  cached = {
    ...parsed.data,
    trustedOrigins: parsed.data.TRUSTED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    isProduction: parsed.data.NODE_ENV === 'production',
    isDevelopment: parsed.data.NODE_ENV === 'development',
    isTest: parsed.data.NODE_ENV === 'test',
  }
  return cached
}

/** Test helper: clear the memoised environment. */
export function resetEnvForTests(): void {
  cached = null
}
