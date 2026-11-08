/**
 * Runs once when the Next.js server process starts.
 * Environment validation is intentionally deferred to this point so that
 * `next build` can run in CI/Docker without production secrets, while a
 * container that starts with bad configuration fails fast and loudly.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  if (process.env.SKIP_ENV_VALIDATION === '1' && process.env.NODE_ENV === 'production') {
    throw new Error('SKIP_ENV_VALIDATION must not be set on a running production server')
  }

  const { getEnv } = await import('@/lib/env')
  const env = getEnv()

  const { logger } = await import('@/lib/logger')
  logger.info(
    {
      app: env.APP_NAME,
      environment: env.NODE_ENV,
      appUrl: env.APP_URL,
      redisRequired: env.REDIS_REQUIRED,
    },
    'server starting',
  )
}
