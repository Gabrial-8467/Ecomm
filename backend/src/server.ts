import app from './app.js';
import { ENV } from './config/env.js';

const server = app.listen(ENV.PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 Retail Platform Backend API is running on port ${ENV.PORT}`);
  console.log(`🌐 Environment: ${ENV.NODE_ENV}`);
  console.log(`📍 API Prefix: http://localhost:${ENV.PORT}${ENV.API_PREFIX}`);
  console.log(`🏥 Health Check: http://localhost:${ENV.PORT}/health`);
  console.log(`🛍️ Storefront URL: http://localhost:3000`);
  console.log(`⚙️ Admin Dashboard URL: http://localhost:3001`);
  console.log(`================================================================`);
});

const handleShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
