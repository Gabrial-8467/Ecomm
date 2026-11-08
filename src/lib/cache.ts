import 'server-only'

import type Redis from 'ioredis'

import { getEnv } from '@/lib/env'
import { getRedis } from '@/lib/redis'

/**
 * Small cache/rate-limit surface shared by Redis (production) and an
 * in-memory store (local development without Redis).
 */
export interface CacheStore {
  readonly backend: 'redis' | 'memory'
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(...keys: string[]): Promise<void>
  /** Atomic increment with a TTL. Returns the new value. */
  incr(key: string, ttlSeconds: number): Promise<number>
}

type MemoryEntry = { value: unknown; expiresAt: number | null }

const globalForMemory = globalThis as unknown as {
  memoryCache?: Map<string, MemoryEntry>
}

const memory = (globalForMemory.memoryCache ??= new Map<string, MemoryEntry>())

function sweep(now: number) {
  if (memory.size < 5_000) return
  for (const [key, entry] of memory) {
    if (entry.expiresAt !== null && entry.expiresAt <= now) memory.delete(key)
  }
}

class MemoryCache implements CacheStore {
  readonly backend = 'memory' as const

  async get<T>(key: string): Promise<T | null> {
    const entry = memory.get(key)
    if (!entry) return null
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      memory.delete(key)
      return null
    }
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    memory.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1_000 : null,
    })
    sweep(Date.now())
  }

  async del(...keys: string[]): Promise<void> {
    for (const key of keys) memory.delete(key)
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const current = await this.get<number>(key)
    const next = (current ?? 0) + 1
    const entry = memory.get(key)
    const expiresAt = entry?.expiresAt ?? (ttlSeconds > 0 ? Date.now() + ttlSeconds * 1_000 : null)
    memory.set(key, { value: next, expiresAt })
    return next
  }
}

class RedisCache implements CacheStore {
  readonly backend = 'redis' as const

  constructor(private readonly client: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialised = JSON.stringify(value)
    if (ttlSeconds) {
      await this.client.set(key, serialised, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, serialised)
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return
    await this.client.del(...keys)
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const result = await this.client.multi().incr(key).expire(key, ttlSeconds, 'NX').exec()
    const value = result?.[0]?.[1]
    if (typeof value !== 'number') {
      throw new Error('Redis increment failed')
    }
    return value
  }
}

const memoryCache = new MemoryCache()
const globalForCache = globalThis as unknown as { cacheStore?: CacheStore }

export async function getCache(): Promise<CacheStore> {
  if (globalForCache.cacheStore) return globalForCache.cacheStore

  const redis = await getRedis()
  const store: CacheStore = redis ? new RedisCache(redis) : memoryCache

  if (!getEnv().isProduction) {
    globalForCache.cacheStore = store
  }
  return store
}

/** Test helper: clear the in-memory fallback and memoised store. */
export function resetCacheForTests(): void {
  memory.clear()
  globalForCache.cacheStore = undefined
}
