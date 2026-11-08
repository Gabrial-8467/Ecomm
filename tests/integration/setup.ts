import 'dotenv/config'

import { testDatabaseUrl } from './database-url'

// Must run before any application module calls `getEnv()`.
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: testDatabaseUrl(),
  REDIS_REQUIRED: 'false',
  EMAIL_PROVIDER: 'console',
  SMS_PROVIDER: 'console',
  LOG_LEVEL: 'silent',
})
