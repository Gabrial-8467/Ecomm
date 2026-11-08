import 'server-only'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'
import { getEnv } from '@/lib/env'

/**
 * Prisma is instantiated once per process. In development Next.js hot-reloads
 * modules, so the instance is parked on `globalThis` to avoid exhausting the
 * PostgreSQL connection pool.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient(): PrismaClient {
  const env = getEnv()
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.isProduction ? 20 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })

  return new PrismaClient({
    adapter,
    log: env.isProduction ? ['warn', 'error'] : ['warn', 'error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (!getEnv().isProduction) {
  globalForPrisma.prisma = prisma
}
