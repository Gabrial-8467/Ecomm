/**
 * Resolves the isolated integration-test database. Never reuse the development
 * database: every integration test run truncates all public tables.
 */
export function testDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL
  if (explicit) return explicit

  const base = process.env.DATABASE_URL
  if (!base) return 'postgresql://postgres@127.0.0.1:55432/ecomm_test'

  const url = new URL(base)
  url.pathname = '/ecomm_test'
  return url.toString()
}
