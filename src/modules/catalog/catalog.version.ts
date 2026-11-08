import 'server-only'

import { getCache } from '@/lib/cache'

const VERSION_KEY = 'catalog:version'
const VERSION_TTL_SECONDS = 60 * 60 * 24 * 365

/**
 * Monotonic catalogue version used for cache keys and ETags. Redis provides a
 * shared counter in production; the in-process fallback is sufficient for
 * local development and tests.
 */
export async function getCatalogVersion(): Promise<number> {
  const cache = await getCache()
  return (await cache.get<number>(VERSION_KEY)) ?? 0
}

export async function bumpCatalogVersion(): Promise<number> {
  const cache = await getCache()
  return cache.incr(VERSION_KEY, VERSION_TTL_SECONDS)
}

export function catalogEtag(version: number, updatedAt: Date): string {
  return `W/"catalog-${version}-${updatedAt.getTime().toString(36)}"`
}
