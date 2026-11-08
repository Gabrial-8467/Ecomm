import 'server-only'

import { getCache } from '@/lib/cache'
import { hashToken } from '@/lib/crypto'
import { RateLimitError } from '@/lib/errors'

export interface RateLimitRule {
  /** Namespaced bucket, e.g. `login`, `otp`, `password-reset`. */
  bucket: string
  /** Distinguishes identities/IPs. Hashed before it reaches the cache. */
  identifier: string
  limit: number
  windowSeconds: number
}

/**
 * Fixed-window counters backed by Redis in production and the in-memory cache
 * in development. Identifiers are hashed so phone numbers/emails are not
 * exposed in Redis keys or cache diagnostics.
 */
export async function enforceRateLimits(rules: readonly RateLimitRule[]): Promise<void> {
  const cache = await getCache()

  for (const rule of rules) {
    const key = `ratelimit:${rule.bucket}:${hashToken(rule.identifier)}`
    const count = await cache.incr(key, rule.windowSeconds)
    if (count > rule.limit) {
      throw new RateLimitError(
        'Too many requests. Please wait a moment and try again.',
        rule.windowSeconds,
      )
    }
  }
}

export async function consumeRateLimit(rule: RateLimitRule): Promise<number> {
  const cache = await getCache()
  const key = `ratelimit:${rule.bucket}:${hashToken(rule.identifier)}`
  return cache.incr(key, rule.windowSeconds)
}
