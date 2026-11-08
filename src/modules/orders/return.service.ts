import 'server-only'

import { randomBytes } from 'node:crypto'
import { z } from 'zod'

import { Prisma, type ReturnStatus } from '@/generated/prisma/client'
import { ConflictError, NotFoundError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

import { getOrderForViewer, newRefundNumber } from './order.service'

const RETURN_WINDOW_DAYS = 7

export function newReturnNumber(): string {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '')
  return `RT-${date}-${randomBytes(3).toString('hex').toUpperCase()}`
}

export function isOrderReturnEligible(order: {
  status: string
  deliveredAt: Date | null
}): { eligible: boolean; reason?: string } {
  if (order.status !== 'DELIVERED') {
    return { eligible: false, reason: 'Only delivered orders are eligible for return.' }
  }
  if (!order.deliveredAt) {
    return { eligible: false, reason: 'Delivery timestamp is not recorded.' }
  }
  const diffMs = Date.now() - new Date(order.deliveredAt).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays > RETURN_WINDOW_DAYS) {
    return {
      eligible: false,
      reason: `Return window expired (eligible within ${RETURN_WINDOW_DAYS} days of delivery).`,
    }
  }
  return { eligible: true }
}

export const customerReturnSchema = z.object({
  orderNumber: z.string().min(1),
  reason: z.enum([
    'DAMAGED',
    'DEFECTIVE',
    'WRONG_ITEM',
    'MISSING_PARTS',
    'NOT_AS_DESCRIBED',
    'SIZE_FIT',
    'CHANGED_MIND',
    'OTHER',
  ] as const),
  description: z.string().trim().min(5, 'Please provide details of the issue.').max(1000),
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        quantity: z.number().int().positive(),
        condition: z.enum(['UNOPENED', 'OPENED', 'DAMAGED', 'DEFECTIVE', 'MISSING_PARTS', 'OTHER'] as const),
      }),
    )
    .min(1, 'Select at least one item to return.'),
})

export type CustomerReturnInput = z.infer<typeof customerReturnSchema>

export async function requestReturnAsCustomer(input: CustomerReturnInput) {
  const validated = customerReturnSchema.parse(input)
  const order = await getOrderForViewer(validated.orderNumber)

  const eligibility = isOrderReturnEligible(order)
  if (!eligibility.eligible) {
    throw new ConflictError(eligibility.reason ?? 'This order is not eligible for return.')
  }

  // Ensure no existing active return request on this order
  const existingReturn = await prisma.returnRequest.findFirst({
    where: {
      orderId: order.id,
      status: { notIn: ['REJECTED', 'CANCELLED'] },
    },
  })
  if (existingReturn) {
    throw new ConflictError('A return request is already open for this order.')
  }

  return prisma.$transaction(async (tx) => {
    // Validate order items
    const orderItemsMap = new Map(order.items.map((i) => [i.id, i]))
    for (const item of validated.items) {
      const orderItem = orderItemsMap.get(item.orderItemId)
      if (!orderItem) throw new NotFoundError('One or more order items are invalid.')
      if (item.quantity > orderItem.quantity) {
        throw new ConflictError(`Return quantity exceeds ordered quantity for ${orderItem.productName}.`)
      }
    }

    const returnNumber = newReturnNumber()
    // Statutory SLA under Consumer Protection E-Commerce Rules: 48h acknowledgement
    const slaDueAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    const returnRequest = await tx.returnRequest.create({
      data: {
        returnNumber,
        orderId: order.id,
        userId: order.userId,
        status: 'REQUESTED',
        reason: validated.reason,
        description: validated.description,
        slaDueAt,
        pickupAddressSnapshot: order.shippingAddressSnapshot as Prisma.InputJsonValue,
        items: {
          create: validated.items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity,
            condition: i.condition,
            reason: validated.reason,
          })),
        },
        history: {
          create: {
            fromStatus: null,
            toStatus: 'REQUESTED',
            note: validated.description,
          },
        },
      },
      include: { items: true },
    })

    await tx.order.update({
      where: { id: order.id },
      data: { status: 'RETURN_REQUESTED' },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'RETURN_REQUESTED',
        note: `Customer requested return: ${validated.reason} (${returnNumber})`,
      },
    })

    return returnRequest
  })
}

export async function listReturnsForStaff(input: {
  status?: ReturnStatus | 'ALL'
  query?: string
  take?: number
} = {}) {
  const term = input.query?.trim()
  const rows = await prisma.returnRequest.findMany({
    where: {
      ...(input.status && input.status !== 'ALL' ? { status: input.status } : {}),
      ...(term
        ? {
            OR: [
              { returnNumber: { contains: term, mode: 'insensitive' } },
              { order: { orderNumber: { contains: term, mode: 'insensitive' } } },
              { order: { email: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          email: true,
          phone: true,
          grandTotal: true,
          paymentStatus: true,
          payments: {
            select: {
              id: true,
              method: true,
              status: true,
              amount: true,
            },
          },
        },
      },
      items: {
        include: {
          orderItem: true,
        },
      },
      refunds: true,
    },
    orderBy: { createdAt: 'desc' },
    take: input.take ?? 100,
  })

  const now = Date.now()
  return rows.map((r) => ({
    ...r,
    isOverdue:
      r.status === 'REQUESTED' && r.slaDueAt ? new Date(r.slaDueAt).getTime() < now : false,
  }))
}

export async function getReturnForStaff(returnId: string) {
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      order: {
        include: {
          items: true,
          payments: true,
          refunds: true,
          invoice: true,
        },
      },
      items: {
        include: {
          orderItem: true,
        },
      },
      history: {
        orderBy: { createdAt: 'asc' },
      },
      refunds: true,
    },
  })
  if (!ret) throw new NotFoundError('Return request not found.')
  return ret
}

export const reviewReturnSchema = z.object({
  returnId: z.string().min(1),
  action: z.enum(['APPROVE', 'REJECT'] as const),
  rejectionReason: z.string().trim().max(500).optional(),
  inspectionNotes: z.string().trim().max(1000).optional(),
  actorUserId: z.string().min(1),
  restockWarehouseId: z.string().optional(),
})

export type ReviewReturnInput = z.infer<typeof reviewReturnSchema>

export async function reviewReturnRequest(input: ReviewReturnInput) {
  const validated = reviewReturnSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const ret = await tx.returnRequest.findUnique({
      where: { id: validated.returnId },
      include: {
        order: { include: { payments: true } },
        items: { include: { orderItem: true } },
      },
    })
    if (!ret) throw new NotFoundError('Return request not found.')

    if (validated.action === 'REJECT') {
      if (!validated.rejectionReason) {
        throw new ConflictError('A rejection reason is required.')
      }

      await tx.returnRequest.update({
        where: { id: ret.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: validated.rejectionReason,
          inspectedBy: validated.actorUserId,
          inspectionNotes: validated.inspectionNotes ?? null,
        },
      })

      await tx.returnStatusHistory.create({
        data: {
          returnRequestId: ret.id,
          fromStatus: ret.status,
          toStatus: 'REJECTED',
          note: validated.rejectionReason,
          actorId: validated.actorUserId,
        },
      })

      await tx.order.update({
        where: { id: ret.orderId },
        data: { status: 'RETURN_REJECTED' },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId: ret.orderId,
          fromStatus: ret.order.status,
          toStatus: 'RETURN_REJECTED',
          note: `Return ${ret.returnNumber} rejected: ${validated.rejectionReason}`,
          changedByUserId: validated.actorUserId,
        },
      })

      return { status: 'REJECTED' }
    }

    // Action is APPROVE
    await tx.returnRequest.update({
      where: { id: ret.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        resolution: 'REFUND',
        inspectedBy: validated.actorUserId,
        inspectionNotes: validated.inspectionNotes ?? null,
      },
    })

    await tx.returnStatusHistory.create({
      data: {
        returnRequestId: ret.id,
        fromStatus: ret.status,
        toStatus: 'APPROVED',
        note: validated.inspectionNotes ?? 'Approved by staff',
        actorId: validated.actorUserId,
      },
    })

    await tx.order.update({
      where: { id: ret.orderId },
      data: { status: 'RETURN_APPROVED' },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: ret.orderId,
        fromStatus: ret.order.status,
        toStatus: 'RETURN_APPROVED',
        note: `Return ${ret.returnNumber} approved`,
        changedByUserId: validated.actorUserId,
      },
    })

    // Calculate refund amount based on returned items
    const refundAmount = ret.items.reduce((sum, item) => {
      const itemTax = item.orderItem.cgst.plus(item.orderItem.sgst).plus(item.orderItem.igst)
      const unitTotal = item.orderItem.unitPrice.times(item.quantity)
      const taxTotal = itemTax.times(item.quantity).dividedBy(item.orderItem.quantity)
      return sum.plus(unitTotal).plus(taxTotal)
    }, new Prisma.Decimal(0))

    const paidPayment = ret.order.payments.find((p) => p.status === 'PAID')
    if (paidPayment) {
      await tx.refund.create({
        data: {
          refundNumber: newRefundNumber(),
          orderId: ret.orderId,
          paymentId: paidPayment.id,
          returnRequestId: ret.id,
          amount: refundAmount,
          reason: `Return approved (${ret.returnNumber})`,
          status: 'REQUESTED',
          idempotencyKey: `return:${ret.id}`,
          initiatedBy: validated.actorUserId,
        },
      })
    }

    // Restock if warehouse specified
    if (validated.restockWarehouseId) {
      for (const item of ret.items) {
        if (
          (item.condition === 'UNOPENED' || item.condition === 'OPENED') &&
          item.orderItem.variantId
        ) {
          const inv = await tx.inventory.findUnique({
            where: {
              variantId_warehouseId: {
                variantId: item.orderItem.variantId,
                warehouseId: validated.restockWarehouseId,
              },
            },
          })
          if (inv) {
            const newOnHand = inv.onHand + item.quantity
            const newReturned = inv.returned + item.quantity
            await tx.inventory.update({
              where: { id: inv.id },
              data: { onHand: newOnHand, returned: newReturned },
            })
            await tx.stockMovement.create({
              data: {
                variantId: item.orderItem.variantId,
                warehouseId: validated.restockWarehouseId,
                type: 'RETURN_RECEIVED',
                quantity: item.quantity,
                onHandAfter: newOnHand,
                reservedAfter: inv.reserved,
                referenceType: 'ReturnRequest',
                referenceId: ret.id,
                reason: `Restocked from return ${ret.returnNumber}`,
                actorUserId: validated.actorUserId,
              },
            })
            await tx.returnItem.update({
              where: { id: item.id },
              data: { restockStatus: 'RESALABLE', approvedQuantity: item.quantity },
            })
          }
        }
      }
    }

    return { status: 'APPROVED' }
  })
}
