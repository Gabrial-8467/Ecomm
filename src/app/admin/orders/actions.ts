'use server'

import { revalidatePath } from 'next/cache'
import { ZodError, z } from 'zod'

import type { OrderStatus } from '@/generated/prisma/client'
import type { ActionResult } from '@/lib/admin/action-result'
import { requirePermissionActor, verifyCsrfForCurrentSession } from '@/lib/auth/guards'
import { isAppError } from '@/lib/errors'
import {
  markOrderPaid,
  transitionOrderStatus,
} from '@/modules/orders/order.service'

function failure(error: unknown): ActionResult {
  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
    )
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors,
    }
  }
  if (isAppError(error)) {
    return { status: 'error', message: error.message }
  }
  console.error('order action failed', error)
  return { status: 'error', message: 'Something went wrong. Please try again.' }
}

const advanceStatusSchema = z.object({
  orderId: z.string().min(1),
  to: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_REJECTED',
    'RETURNED',
    'REFUND_INITIATED',
    'REFUNDED',
    'FAILED',
  ] as const),
  note: z.string().trim().max(500).optional(),
})

export async function advanceOrderStatusAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requirePermissionActor('orders:write')
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())

    const parsed = advanceStatusSchema.parse({
      orderId: String(formData.get('orderId') ?? '').trim(),
      to: String(formData.get('to') ?? '').trim() as OrderStatus,
      note: String(formData.get('note') ?? '').trim() || undefined,
    })

    await transitionOrderStatus({
      orderId: parsed.orderId,
      to: parsed.to,
      actorId: actor.userId,
      note: parsed.note,
    })

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${parsed.orderId}`)

    return {
      status: 'success',
      message: `Order status moved to ${parsed.to.replaceAll('_', ' ').toLowerCase()}.`,
    }
  } catch (error) {
    return failure(error)
  }
}

const markPaidSchema = z.object({
  orderId: z.string().min(1),
  reference: z.string().trim().min(3, 'Enter a collection receipt or cash reference.').max(100),
})

export async function markOrderPaidAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requirePermissionActor('payments:write')
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())

    const parsed = markPaidSchema.parse({
      orderId: String(formData.get('orderId') ?? '').trim(),
      reference: String(formData.get('reference') ?? '').trim(),
    })

    await markOrderPaid({
      orderId: parsed.orderId,
      actorId: actor.userId,
      reference: parsed.reference,
    })

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${parsed.orderId}`)

    return {
      status: 'success',
      message: 'Payment recorded and order confirmed.',
    }
  } catch (error) {
    return failure(error)
  }
}
