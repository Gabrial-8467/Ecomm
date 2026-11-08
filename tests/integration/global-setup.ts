import 'dotenv/config'

import { execFileSync } from 'node:child_process'

import { Client } from 'pg'

import { testDatabaseUrl } from './database-url'

function adminUrlFor(target: string): string {
  const url = new URL(target)
  url.pathname = '/postgres'
  return url.toString()
}

async function ensureDatabase(target: string): Promise<void> {
  const url = new URL(target)
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!database) throw new Error('Test database name is missing from TEST_DATABASE_URL')

  const client = new Client({ connectionString: adminUrlFor(target) })
  await client.connect()
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database])
    if (existing.rowCount === 0) {
      // Identifier cannot be parameterised; quote it defensively.
      await client.query(`CREATE DATABASE "${database.replaceAll('"', '""')}"`)
    }
  } finally {
    await client.end()
  }
}

/**
 * Vitest global setup: create the test database when missing and apply every
 * committed migration before any test file imports Prisma.
 */
export default async function setup(): Promise<void> {
  const target = testDatabaseUrl()
  await ensureDatabase(target)

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: target, SKIP_ENV_VALIDATION: '1' },
  })
}
