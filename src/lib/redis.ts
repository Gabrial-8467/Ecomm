import 'server-only'

import Redis from 'ioredis'

import { getEnv } from '@/lib/env'

/**
 * Single Redis connection shared by the process.
 *
 * Development computers often lack Redis. When REDIS_REQUIRED=false the
 * application transparently falls back to an in-process cache so the
 * storefront remains usable. Production validation forbids that fallback.
 */

const globalForRedis = globalThis as unknown as {
  redis?: Redis | null
  redisUnavailable?: boolean
}

let connectionPromise: Promise<Redis | null> | null = null

async function connect(): Promise<Redis | null> {
  const env = getEnv()

  if (globalForRedis.redisUnavailable) {
    if (env.REDIS_REQUIRED) {
      throw new Error('Redis is required but is currently unavailable')
    }
    return null
  }

  if (globalForRedis.redis) return globalForRedis.redis

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    keyPrefix: `${env.REDIS_PREFIX}:`,
    retryStrategy: (attempt) => (attempt > 3 ? null : Math.min(attempt * 200, 1_000)),
  })

  client.on('error', () => {
    // Errors are handled by the connection/call site to avoid crashing the
    // process on a transient Redis outage.
  })

  try {
    await client.connect()
    await client.ping()
  } catch (error) {
    client.disconnect()
    globalForRedis.redisUnavailable = true
    if (env.REDIS_REQUIRED) {
      throw new Error('Redis is required but the connection failed', { cause: error })
    }
    return null
  }

  globalForRedis.redis = client
  return client
}

export function getRedis(): Promise<Redis | null> {
  connectionPromise ??= connect()
  return connectionPromise
}

/** Test helper. */
export function resetRedisForTests(): void {
  connectionPromise = null
  globalForRedis.redis?.disconnect()
  globalForRedis.redis = undefined
  globalForRedis.redisUnavailable = undefined
}
