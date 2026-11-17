import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function startServer() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Backend API server running on http://localhost:${env.PORT}`);
    logger.info(`📡 Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      logger.info('🔒 HTTP server closed.');
      await disconnectDatabase();
      logger.info('💾 Database disconnected.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('⚠️ Forcefully terminating after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  logger.error('Fatal startup error:', error);
  process.exit(1);
});
