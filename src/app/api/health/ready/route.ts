import { NextResponse } from 'next/server'

import { getCache } from '@/lib/cache'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Readiness probe: verifies PostgreSQL and the cache/queue backend. */
export async function GET() {
  const checks: Record<string, 'ok' | 'failed'> = {}

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch (error) {
    checks.database = 'failed'
    logger.error({ err: error }, 'readiness: database check failed')
  }

  try {
    const cache = await getCache()
    await cache.set('health:ready', Date.now(), 10)
    checks.cache = 'ok'
  } catch (error) {
    checks.cache = 'failed'
    logger.error({ err: error }, 'readiness: cache check failed')
  }

  const ready = Object.values(checks).every((value) => value === 'ok')

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
