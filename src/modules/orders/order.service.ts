import 'server-only'

import { randomBytes } from 'node:crypto'

import type { OrderStatus, Prisma } from '@/generated/prisma/client'
import { getCurrentActor } from '@/lib/auth/guards'
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

import { hasOrderAccess, readOrderAccessIds } from './order-access'

export const orderInclude = {
  items: { orderBy: { createdAt: 'asc' } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
  payments: { orderBy: { createdAt: 'desc' } },
  refunds: { orderBy: { createdAt: 'desc' } },
  shipments: { orderBy: { createdAt: 'desc' } },
  invoice: true,
  returns: {
    orderBy: { createdAt: 'desc' },
    include: { items: true, history: { orderBy: { createdAt: 'asc' } } },
  },
} satisfies Prisma.OrderInclude

export type OrderWithDetail = Prisma.OrderGetPayload<{ include: typeof orderInclude }>

export interface OrderViewer {
  userId: string | null
  guestOrderIds: string[]
}

export async function currentOrderViewer(): Promise<OrderViewer> {
  const actor = await getCurrentActor()
  return {
    userId: actor?.userId ?? null,
    guestOrderIds: actor ? [] : await readOrderAccessIds(),
  }
}

function canView(order: { id: string; userId: string | null }, viewer: OrderViewer): boolean {
  if (viewer.userId && order.userId === viewer.userId) return true
  if (!viewer.userId && order.userId === null) {
    return viewer.guestOrderIds.includes(order.id)
  }
  return false
}

/**
 * Order lookup scoped to the current viewer. Signed-in customers see orders
 * attached to their user id; guests see only orders listed in their signed
 * `cc_order_access` cookie. Staff use the admin service instead.
 */
export async function getOrderForViewer(orderNumber: string): Promise<OrderWithDetail> {
  const viewer = await currentOrderViewer()
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: orderInclude,
  })
  if (!order) throw new NotFoundError('That order could not be found.')
  if (!viewer.userId && order.userId === null) {
    if (!(await hasOrderAccess(order.id))) {
      throw new ForbiddenError('This order is not linked to this browser.')
    }
  } else if (!canView(order, viewer)) {
    throw new ForbiddenError('This order is not linked to your account.')
  }
  return order
}

export async function listOrdersForViewer(): Promise<OrderWithDetail[]> {
  const viewer = await currentOrderViewer()
  if (viewer.userId) {
    return prisma.order.findMany({
      where: { userId: viewer.userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    })
  }
  if (viewer.guestOrderIds.length === 0) return []
  return prisma.order.findMany({
    where: { id: { in: viewer.guestOrderIds }, userId: null },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  })
}

/** Statuses a customer may cancel from before any fulfilment has happened. */
const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING']

export const STAFF_NEXT_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'FAILED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  CANCELLED: [],
  PARTIALLY_CANCELLED: [],
  RETURN_REQUESTED: ['RETURN_APPROVED', 'RETURN_REJECTED'],
  RETURN_APPROVED: ['RETURNED', 'REFUND_INITIATED'],
  RETURN_REJECTED: [],
  RETURNED: ['REFUND_INITIATED'],
  REFUND_INITIATED: ['REFUNDED'],
  REFUNDED: [],
  FAILED: ['PENDING'],
}

/** Release reserved stock when an order is cancelled. */
export async function releaseOrderStock(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, status: { in: ['ACTIVE', 'CONFIRMED'] } },
  })
  for (const reservation of reservations) {
    const inventory = await tx.inventory.findUnique({
      where: {
        variantId_warehouseId: {
          variantId: reservation.variantId,
          warehouseId: reservation.warehouseId,
        },
      },
    })
    if (inventory) {
      const reservedAfter = Math.max(0, inventory.reserved - reservation.quantity)
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reserved: reservedAfter },
      })
      await tx.stockMovement.create({
        data: {
          variantId: reservation.variantId,
          warehouseId: reservation.warehouseId,
          type: 'SALE_RELEASED',
          quantity: -reservation.quantity,
          onHandAfter: inventory.onHand,
          reservedAfter,
          referenceType: 'Order',
          referenceId: orderId,
          reason: 'Order cancelled',
        },
      })
    }
    await tx.stockReservation.update({
      where: { id: reservation.id },
      data: { status: 'RELEASED' },
    })
  }
}

function orderNumber(): string {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '')
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `CC-${date}-${suffix}`
}

export function newOrderNumber(): string {
  return orderNumber()
}

export function newRefundNumber(): string {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '')
  return `RF-${date}-${randomBytes(3).toString('hex').toUpperCase()}`
}

export async function transitionOrderStatus(input: {
  orderId: string
  to: OrderStatus
  actorId: string | null
  note?: string | null
  metadata?: Prisma.InputJsonValue
}): Promise<OrderWithDetail> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: input.orderId } })
    if (!order) throw new NotFoundError('That order could not be found.')
    if (order.status === input.to) return tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: orderInclude,
    })
    const allowed = STAFF_NEXT_STATUSES[order.status]
    if (!allowed.includes(input.to)) {
      throw new ConflictError(
        `An order in ${order.status.replaceAll('_', ' ').toLowerCase()} cannot move to ${input.to
          .replaceAll('_', ' ')
          .toLowerCase()}.`,
      )
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.to,
        ...(input.to === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        ...(input.to === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
      },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: input.to,
        note: input.note ?? null,
        changedByUserId: input.actorId,
        metadata: input.metadata,
      },
    })

    return tx.order.findUniqueOrThrow({ where: { id: updated.id }, include: orderInclude })
  })
}

/**
 * Customer cancellation. If money was captured we record a refund request but
 * never claim it has been returned until a provider or manual reference exists.
 */
export async function cancelOrderAsCustomer(orderNumber: string, reason?: string): Promise<void> {
  const viewer = await currentOrderViewer()
  const order = await getOrderForViewer(orderNumber)
  if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
    throw new ConflictError(
      'This order can no longer be cancelled online. Contact customer care for help.',
    )
  }
  if (!canView(order, viewer)) throw new ForbiddenError()

  await prisma.$transaction(async (tx) => {
    await releaseOrderStock(tx, order.id)

    const paidPayment = order.payments.find((payment) => payment.status === 'PAID')
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'CANCELLED',
        note: reason?.slice(0, 500) || 'Cancelled by customer',
      },
    })
    await tx.orderItem.updateMany({
      where: { orderId: order.id },
      data: { status: 'CANCELLED' },
    })

    if (paidPayment) {
      await tx.refund.create({
        data: {
          refundNumber: newRefundNumber(),
          orderId: order.id,
          paymentId: paidPayment.id,
          amount: paidPayment.amount,
          reason: reason?.slice(0, 500) || 'Order cancelled by customer',
          status: 'REQUESTED',
          idempotencyKey: `cancel:${order.id}`,
        },
      })
    }
  })
}

/** Staff marks a cash-on-delivery order as collected. */
export async function markOrderPaid(input: {
  orderId: string
  actorId: string
  reference?: string | null
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { payments: true },
    })
    if (!order) throw new NotFoundError('That order could not be found.')
    if (order.paymentStatus === 'PAID') return
    const payment = order.payments.find((row) => row.method === 'COD')
    if (!payment) throw new ConflictError('This order has no cash-on-delivery payment to settle.')

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        capturedAt: new Date(),
        rawSummary: input.reference ? { manualReference: input.reference } : undefined,
      },
    })
    await tx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'CAPTURED',
        amount: payment.amount,
        providerReference: input.reference ?? null,
        payloadHash: null,
        signatureVerified: false,
      },
    })
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        amountPaid: payment.amount,
        ...(order.status === 'PENDING' ? { status: 'CONFIRMED' } : {}),
      },
    })
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
        note: `Cash collected${input.reference ? ` · ${input.reference}` : ''}`,
        changedByUserId: input.actorId,
      },
    })
  })
}

export async function listOrdersForStaff(input: {
  status?: OrderStatus | 'ALL'
  query?: string
  take?: number
} = {}): Promise<OrderWithDetail[]> {
  const term = input.query?.trim()
  return prisma.order.findMany({
    where: {
      ...(input.status && input.status !== 'ALL' ? { status: input.status } : {}),
      ...(term
        ? {
            OR: [
              { orderNumber: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
              { phone: { contains: term } },
            ],
          }
        : {}),
    },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    take: input.take ?? 100,
  })
}

export async function getOrderForStaff(orderId: string): Promise<OrderWithDetail> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude })
  if (!order) throw new NotFoundError('That order could not be found.')
  return order
}

export function orderStatusLabel(status: OrderStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
