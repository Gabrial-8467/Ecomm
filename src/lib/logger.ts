import 'server-only'

import pino, { type Logger } from 'pino'

import { getEnv } from '@/lib/env'

/**
 * Structured logging. Production emits JSON to stdout for the platform log
 * collector; local development uses pino-pretty.
 */
function createLogger(): Logger {
  const env = getEnv()

  const options = {
    level: env.LOG_LEVEL,
    base: { service: env.APP_NAME, env: env.NODE_ENV },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'passwordHash',
        'token',
        'tokenHash',
        'secret',
        'apiKey',
        'csrfToken',
        'otp',
        '*.password',
        '*.passwordHash',
        '*.token',
        '*.secret',
      ],
      censor: '[redacted]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  if (env.LOG_FORMAT === 'pretty' && !env.isProduction) {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      },
    })
  }

  return pino(options)
}

const globalForLogger = globalThis as unknown as { logger?: Logger }

export const logger: Logger = (globalForLogger.logger ??= createLogger())

export function childLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings)
}
