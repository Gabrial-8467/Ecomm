import { PrismaClient } from '@prisma/client';
import { ENV } from '../config/env.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (ENV.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
