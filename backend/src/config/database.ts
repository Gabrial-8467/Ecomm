import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    // Raw SQL is noisy; enable it only with LOG_PRISMA_QUERIES=true when debugging.
    log: [
      'error',
      'warn',
      ...(env.LOG_PRISMA_QUERIES ? (['query'] as const) : []),
    ],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL database connected successfully via Prisma');
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL database:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
