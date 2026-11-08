import { NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { processRazorpayWebhook } from '@/modules/payments/webhook.service'
import { verifyWebhookSignature } from '@/modules/payments/razorpay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Razorpay webhooks. The raw body is required for HMAC verification, so the
 * request is read as text before any parsing. Invalid signatures are rejected
 * without writing an event row; the provider can retry safely.
 */
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn({ hasSignature: Boolean(signature) }, 'rejected razorpay webhook signature')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let eventType = request.headers.get('x-razorpay-event-type') ?? 'unknown'
  try {
    const parsed = JSON.parse(rawBody) as { event?: string }
    eventType = parsed.event ?? eventType
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const eventId =
    request.headers.get('x-razorpay-event-id') ??
    `${eventType}:${request.headers.get('x-razorpay-signature')?.slice(0, 16) ?? 'unknown'}`

  try {
    const result = await processRazorpayWebhook({ eventId, eventType, rawBody })
    return NextResponse.json({ received: true, status: result.status })
  } catch (error) {
    logger.error({ err: error, eventType }, 'razorpay webhook processing failed')
    return NextResponse.json({ error: 'processing failed' }, { status: 500 })
  }
}
