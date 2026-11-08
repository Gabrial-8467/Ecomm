import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Production cookie attributes are part of the security acceptance criteria.
 * `getEnv()` memoises per module instance, so each scenario resets the module
 * registry before importing the cookie helpers.
 */

const BASE_ENV = {
  NODE_ENV: 'production',
  APP_URL: 'https://shop.casacircuit.example',
  TRUSTED_ORIGINS: 'https://shop.casacircuit.example',
  REDIS_REQUIRED: 'true',
  SUPPORT_EMAIL: 'support@casacircuit.example',
  EMAIL_FROM: 'CasaCircuit <no-reply@casacircuit.example>',
  RAZORPAY_KEY_ID: 'rzp_test_placeholder',
  RAZORPAY_KEY_SECRET: 'placeholder-secret',
  RAZORPAY_WEBHOOK_SECRET: 'placeholder-webhook-secret',
  DIRECT_DATABASE_URL: 'postgresql://postgres@127.0.0.1:55432/ecomm_test',
} as const

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('production auth cookie configuration', () => {
  it('uses Secure, HttpOnly, SameSite=Lax cookies with __Host- prefixes over HTTPS', async () => {
    for (const [key, value] of Object.entries(BASE_ENV)) vi.stubEnv(key, value)
    vi.resetModules()

    const { authCookieConfig, csrfCookieOptions, sessionCookieOptions } =
      await import('@/lib/auth/cookies')

    const customer = authCookieConfig('customer')
    expect(customer.name).toBe('__Host-cc_session')
    expect(customer.csrfName).toBe('cc_csrf')
    expect(customer.secure).toBe(true)

    const staff = authCookieConfig('staff')
    expect(staff.name).toBe('__Host-cc_staff_session')
    expect(staff.secure).toBe(true)

    const session = sessionCookieOptions(3_600, true)
    expect(session).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3_600,
    })

    const csrf = csrfCookieOptions(3_600, true)
    expect(csrf).toMatchObject({
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3_600,
    })
  })

  it('falls back to unprefixed, non-Secure cookies only for loopback HTTP smoke tests', async () => {
    const loopback = {
      ...BASE_ENV,
      APP_URL: 'http://localhost:3000',
      TRUSTED_ORIGINS: 'http://localhost:3000',
    }
    for (const [key, value] of Object.entries(loopback)) vi.stubEnv(key, value)
    vi.resetModules()

    const { authCookieConfig } = await import('@/lib/auth/cookies')
    const config = authCookieConfig('customer')

    expect(config.name).toBe('cc_session')
    expect(config.secure).toBe(false)
  })
})
