import 'server-only'

import { cookies } from 'next/headers'

import { getEnv } from '@/lib/env'

export type SessionKind = 'customer' | 'staff'

export interface AuthCookieConfig {
  name: string
  csrfName: string
  secure: boolean
  /** Prefix mandated by the __Host- cookie rules when served over HTTPS. */
  hostPrefix: string
}

function isLoopbackAppUrl(): boolean {
  try {
    const url = new URL(getEnv().APP_URL)
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}

/**
 * Production cookies are Secure + __Host- whenever the app is served over
 * HTTPS. The local compose stack runs NODE_ENV=production on loopback HTTP
 * for smoke tests; in that specific case Secure cookies cannot be sent by a
 * browser, so we fall back to an unprefixed cookie. Real deployments MUST use
 * HTTPS (checked by `docs/05-SECURITY.md` go-live checklist).
 */
export function authCookieConfig(kind: SessionKind): AuthCookieConfig {
  const env = getEnv()
  const secure = env.isProduction && !isLoopbackAppUrl()
  const hostPrefix = secure ? '__Host-' : ''
  const base = kind === 'staff' ? env.STAFF_SESSION_COOKIE_NAME : env.SESSION_COOKIE_NAME
  const name = base.startsWith('__Host-') ? base : `${hostPrefix}${base}`
  const csrfBase = kind === 'staff' ? 'cc_staff_csrf' : 'cc_csrf'

  return {
    name,
    csrfName: csrfBase,
    secure,
    hostPrefix,
  }
}

export function sessionCookieOptions(
  maxAgeSeconds: number,
  secure: boolean,
): {
  httpOnly: true
  secure: boolean
  sameSite: 'lax'
  path: '/'
  maxAge: number
  priority: 'high'
} {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
    priority: 'high',
  }
}

export function csrfCookieOptions(
  maxAgeSeconds: number,
  secure: boolean,
): {
  httpOnly: false
  secure: boolean
  sameSite: 'lax'
  path: '/'
  maxAge: number
  priority: 'high'
} {
  return {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
    priority: 'high',
  }
}

export interface IssuedSessionCookies {
  kind: SessionKind
  token: string
  csrfToken: string
  maxAgeSeconds: number
}

/** Set the HttpOnly session cookie and the JS-readable companion CSRF token. */
export async function setAuthCookies(session: IssuedSessionCookies): Promise<void> {
  const config = authCookieConfig(session.kind)
  const store = await cookies()

  // A user is either a customer or staff, never both.
  const other = authCookieConfig(session.kind === 'staff' ? 'customer' : 'staff')
  store.delete(other.name)
  store.delete(other.csrfName)

  store.set(config.name, session.token, sessionCookieOptions(session.maxAgeSeconds, config.secure))
  store.set(
    config.csrfName,
    session.csrfToken,
    csrfCookieOptions(session.maxAgeSeconds, config.secure),
  )
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies()
  for (const kind of ['customer', 'staff'] as const) {
    const config = authCookieConfig(kind)
    store.delete(config.name)
    store.delete(config.csrfName)
  }
}

export async function readAuthCookies(): Promise<{
  kind: SessionKind
  token: string
} | null> {
  const store = await cookies()
  const staff = store.get(authCookieConfig('staff').name)?.value
  if (staff) return { kind: 'staff', token: staff }
  const customer = store.get(authCookieConfig('customer').name)?.value
  if (customer) return { kind: 'customer', token: customer }
  return null
}

export async function readCsrfCookie(kind?: SessionKind): Promise<string | null> {
  const store = await cookies()
  if (kind) return store.get(authCookieConfig(kind).csrfName)?.value ?? null
  const staff = store.get(authCookieConfig('staff').csrfName)?.value
  if (staff) return staff
  return store.get(authCookieConfig('customer').csrfName)?.value ?? null
}
