import 'server-only'

import { createHash } from 'node:crypto'

import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import {
  finalizeRazorpayPayment,
  markRazorpayPaymentFailed,
} from '@/modules/checkout/checkout.service'

interface RazorpayWebhookPayload {
  event?: string
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; error_description?: string } }
    refund?: { entity?: { id?: string; payment_id?: string; amount?: number; status?: string } }
  }
}

function hashBody(rawBody: string): string {
  return createHash('sha256').update(rawBody, 'utf8').digest('hex')
}

/**
 * Persist the webhook before dispatching. The unique (provider, eventId)
 * constraint makes retries from the provider idempotent.
 */
export async function recordWebhookEvent(input: {
  provider: string
  eventId: string
  eventType: string
  rawBody: string
}): Promise<{ eventId: string; duplicate: boolean }> {
  try {
    const row = await prisma.webhookEvent.create({
      data: {
        provider: input.provider,
        eventId: input.eventId,
        eventType: input.eventType,
        payloadHash: hashBody(input.rawBody),
        status: 'RECEIVED',
      },
      select: { id: true },
    })
    return { eventId: row.id, duplicate: false }
  } catch (error) {
    const existing = await prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: input.provider, eventId: input.eventId } },
      select: { id: true },
    })
    if (existing) return { eventId: existing.id, duplicate: true }
    throw error
  }
}

async function orderNumberForProviderOrder(providerOrderId: string | undefined): Promise<string | null> {
  if (!providerOrderId) return null
  const payment = await prisma.payment.findFirst({
    where: { providerOrderId },
    select: { order: { select: { orderNumber: true } } },
  })
  return payment?.order.orderNumber ?? null
}

async function dispatch(eventType: string, payload: RazorpayWebhookPayload): Promise<'PROCESSED' | 'IGNORED'> {
  switch (eventType) {
    case 'payment.captured':
    case 'order.paid': {
      const entity = payload.payload?.payment?.entity
      const orderNumber = await orderNumberForProviderOrder(entity?.order_id)
      if (!orderNumber || !entity?.id) return 'IGNORED'
      await finalizeRazorpayPayment({
        orderNumber,
        razorpayOrderId: entity.order_id!,
        razorpayPaymentId: entity.id,
        signature: null,
        trustedWebhook: true,
      })
      return 'PROCESSED'
    }
    case 'payment.failed': {
      const entity = payload.payload?.payment?.entity
      const orderNumber = await orderNumberForProviderOrder(entity?.order_id)
      if (!orderNumber) return 'IGNORED'
      await markRazorpayPaymentFailed({
        orderNumber,
        reason: entity?.error_description ?? 'Payment failed at the provider',
      })
      return 'PROCESSED'
    }
    case 'refund.processed':
    case 'refund.created': {
      const entity = payload.payload?.refund?.entity
      if (!entity?.id) return 'IGNORED'
      const refund = await prisma.refund.findUnique({
        where: { providerRefundId: entity.id },
        include: { payment: true },
      })
      if (!refund) return 'IGNORED'
      if (refund.status === 'COMPLETED') return 'PROCESSED'

      await prisma.$transaction(async (tx) => {
        await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        })
        const order = await tx.order.findUnique({ where: { id: refund.orderId } })
        if (!order) return
        const refunded = order.amountRefunded.plus(refund.amount)
        const fullyRefunded = refunded.greaterThanOrEqualTo(order.amountPaid)
        await tx.order.update({
          where: { id: order.id },
          data: {
            amountRefunded: refunded.toFixed(2),
            paymentStatus: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            status: fullyRefunded ? 'REFUNDED' : 'REFUND_INITIATED',
          },
        })
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: fullyRefunded ? 'REFUNDED' : 'REFUND_INITIATED',
            note: `Refund ${refund.refundNumber} completed by the payment provider`,
          },
        })
      })
      return 'PROCESSED'
    }
    default:
      return 'IGNORED'
  }
}

export async function processRazorpayWebhook(input: {
  eventId: string
  eventType: string
  rawBody: string
}): Promise<{ status: 'PROCESSED' | 'IGNORED' | 'DUPLICATE' }> {
  const recorded = await recordWebhookEvent({
    provider: 'razorpay',
    eventId: input.eventId,
    eventType: input.eventType,
    rawBody: input.rawBody,
  })
  if (recorded.duplicate) return { status: 'DUPLICATE' }

  try {
    const payload = JSON.parse(input.rawBody) as RazorpayWebhookPayload
    const outcome = await dispatch(payload.event ?? input.eventType, payload)
    await prisma.webhookEvent.update({
      where: { id: recorded.eventId },
      data: { status: outcome, processedAt: new Date(), attempts: { increment: 1 } },
    })
    return { status: outcome }
  } catch (error) {
    logger.error({ err: error, eventType: input.eventType }, 'razorpay webhook failed')
    await prisma.webhookEvent.update({
      where: { id: recorded.eventId },
      data: {
        status: 'FAILED',
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
      },
    })
    throw error
  }
}
