import 'server-only'

import { cookies } from 'next/headers'

import { authCookieConfig, sessionCookieOptions } from '@/lib/auth/cookies'
import { hashToken, randomToken } from '@/lib/crypto'

const GUEST_COOKIE_BASE = 'cc_guest'
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

function guestCookieName(): string {
  const { hostPrefix } = authCookieConfig('customer')
  return `${hostPrefix}${GUEST_COOKIE_BASE}`
}

/**
 * The guest cookie holds a high-entropy opaque token. Only its SHA-256 hash is
 * persisted on carts and wishlists, so a database leak cannot be replayed as a
 * cookie. The cookie is HttpOnly and SameSite=Lax.
 */
export async function readGuestTokenHash(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(guestCookieName())?.value
  return token ? hashToken(token) : null
}

/**
 * Returns the existing guest token hash or issues a new cookie. Must only be
 * called from a Server Action or Route Handler, where Next.js permits cookie
 * writes.
 */
export async function ensureGuestTokenHash(): Promise<string> {
  const store = await cookies()
  const existing = store.get(guestCookieName())?.value
  if (existing) return hashToken(existing)

  const token = randomToken(32)
  const { secure } = authCookieConfig('customer')
  store.set(guestCookieName(), token, sessionCookieOptions(GUEST_COOKIE_MAX_AGE, secure))
  return hashToken(token)
}

export async function clearGuestToken(): Promise<void> {
  const store = await cookies()
  store.delete(guestCookieName())
}
