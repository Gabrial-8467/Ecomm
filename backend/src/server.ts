import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function startServer() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Backend API server running on http://localhost:${env.PORT}`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await disconnectDatabase();
      console.log('💾 Database disconnected.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('⚠️ Forcefully terminating after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
