import 'server-only'

import { createHmac } from 'node:crypto'

import { AppError, ValidationError } from '@/lib/errors'
import { getEnv } from '@/lib/env'
import { logger } from '@/lib/logger'
import { safeEqual } from '@/lib/crypto'

const API_BASE = 'https://api.razorpay.com/v1'

export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string | null
  status: string
}

export function razorpayConfigured(): boolean {
  const env = getEnv()
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
}

export function razorpayWebhookConfigured(): boolean {
  return Boolean(getEnv().RAZORPAY_WEBHOOK_SECRET)
}

function authHeader(): string {
  const env = getEnv()
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Online payment is not configured for this store.', {
      status: 503,
      code: 'PAYMENT_FAILED',
    })
  }
  return `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    logger.error({ err: error, path }, 'razorpay request failed')
    throw new AppError('The payment provider could not be reached. Please try again.', {
      status: 502,
      code: 'PAYMENT_FAILED',
    })
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    logger.error({ status: response.status, path, body: body.slice(0, 500) }, 'razorpay error')
    throw new AppError('The payment provider rejected the request. Please try again.', {
      status: 502,
      code: 'PAYMENT_FAILED',
    })
  }

  return (await response.json()) as T
}

export async function createRazorpayOrder(input: {
  amountPaise: number
  receipt: string
  notes?: Record<string, string>
}): Promise<RazorpayOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new ValidationError('The payable amount is not valid for online payment.')
  }
  return request<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt.slice(0, 40),
      notes: input.notes ?? {},
      payment_capture: 1,
    }),
  })
}

/** Razorpay signs `order_id|payment_id` with the key secret. */
export function verifyCheckoutSignature(input: {
  razorpayOrderId: string
  razorpayPaymentId: string
  signature: string
}): boolean {
  const env = getEnv()
  if (!env.RAZORPAY_KEY_SECRET) return false
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`, 'utf8')
    .digest('hex')
  return safeEqual(expected, input.signature.trim())
}

/** Webhook signatures are HMAC-SHA256 of the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const env = getEnv()
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false
  const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex')
  return safeEqual(expected, signature.trim())
}

export interface RazorpayRefund {
  id: string
  payment_id: string
  amount: number
  status: string
}

export async function createRazorpayRefund(input: {
  paymentId: string
  amountPaise: number
  idempotencyKey: string
  notes?: Record<string, string>
}): Promise<RazorpayRefund> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new ValidationError('The refund amount is not valid.')
  }
  return request<RazorpayRefund>(`/payments/${encodeURIComponent(input.paymentId)}/refund`, {
    method: 'POST',
    headers: { 'X-Razorpay-Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      amount: input.amountPaise,
      notes: input.notes ?? {},
      speed: 'normal',
    }),
  })
}
