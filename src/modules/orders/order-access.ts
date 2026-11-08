import 'server-only'

import { createHmac } from 'node:crypto'

import { cookies } from 'next/headers'

import { authCookieConfig, sessionCookieOptions } from '@/lib/auth/cookies'
import { safeEqual } from '@/lib/crypto'
import { getEnv } from '@/lib/env'

const ORDER_COOKIE_BASE = 'cc_order_access'
const MAX_ORDERS = 20

interface OrderAccessPayload {
  ids: string[]
  exp: number
}

function cookieName(): string {
  return `${authCookieConfig('customer').hostPrefix}${ORDER_COOKIE_BASE}`
}

function sign(value: string): string {
  return createHmac('sha256', getEnv().SESSION_SECRET).update(value, 'utf8').digest('base64url')
}

function encode(payload: OrderAccessPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${body}.${sign(body)}`
}

function decode(value: string | undefined): OrderAccessPayload | null {
  if (!value) return null
  const [body, signature] = value.split('.')
  if (!body || !signature) return null
  if (!safeEqual(signature, sign(body))) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const payload = parsed as OrderAccessPayload
    if (!Array.isArray(payload.ids) || typeof payload.exp !== 'number') return null
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Guests do not have an account to scope an order to, so after checkout we
 * issue a signed HttpOnly cookie listing the order ids this browser may view.
 * Account owners never need it: their orders are scoped by `userId`.
 */
export async function grantOrderAccess(orderId: string): Promise<void> {
  const env = getEnv()
  const store = await cookies()
  const current = decode(store.get(cookieName())?.value)
  const ids = [...new Set([orderId, ...(current?.ids ?? [])])].slice(0, MAX_ORDERS)
  const exp = Date.now() + env.ORDER_ACCESS_TTL_DAYS * 24 * 60 * 60 * 1_000
  store.set(
    cookieName(),
    encode({ ids, exp }),
    sessionCookieOptions(env.ORDER_ACCESS_TTL_DAYS * 24 * 60 * 60, authCookieConfig('customer').secure),
  )
}

export async function readOrderAccessIds(): Promise<string[]> {
  const store = await cookies()
  return decode(store.get(cookieName())?.value)?.ids ?? []
}

export async function hasOrderAccess(orderId: string): Promise<boolean> {
  return (await readOrderAccessIds()).includes(orderId)
}

export async function clearOrderAccess(): Promise<void> {
  const store = await cookies()
  store.delete(cookieName())
}
