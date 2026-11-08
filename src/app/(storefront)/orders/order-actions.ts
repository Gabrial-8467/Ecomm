'use server'

import { revalidatePath } from 'next/cache'

import type { ReturnItemCondition, ReturnReason } from '@/generated/prisma/client'
import { isAppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { cancelOrderAsCustomer } from '@/modules/orders/order.service'
import { requestReturnAsCustomer } from '@/modules/orders/return.service'
import { grantOrderAccess } from '@/modules/orders/order-access'
import { prisma } from '@/lib/prisma'

export interface OrderActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  redirectUrl?: string
}

export async function trackGuestOrderAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const orderNumber = String(formData.get('orderNumber') ?? '').trim().toUpperCase()
  const contact = String(formData.get('contact') ?? '').trim().toLowerCase()

  if (!orderNumber || !contact) {
    return { status: 'error', message: 'Enter both order number and registered email or phone.' }
  }

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, orderNumber: true, email: true, phone: true },
    })

    const cleanContact = contact.replace(/\D/g, '')
    const cleanPhone = order?.phone ? order.phone.replace(/\D/g, '') : ''

    const emailMatch = order?.email && order.email.toLowerCase() === contact
    const phoneMatch = cleanPhone && cleanContact && cleanPhone === cleanContact

    if (!order || (!emailMatch && !phoneMatch)) {
      return {
        status: 'error',
        message: 'No matching order found for those details. Please check your order confirmation.',
      }
    }

    await grantOrderAccess(order.id)
    return {
      status: 'success',
      redirectUrl: `/orders/${order.orderNumber}`,
    }
  } catch (error) {
    logger.error({ err: error }, 'guest order tracking lookup failed')
    return { status: 'error', message: 'Unable to track order. Please try again.' }
  }
}

export async function cancelCustomerOrderAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const orderNumber = String(formData.get('orderNumber') ?? '').trim()
  const reason = String(formData.get('reason') ?? '').trim()

  if (!orderNumber) {
    return { status: 'error', message: 'Order number is required.' }
  }

  try {
    await cancelOrderAsCustomer(orderNumber, reason || undefined)
    revalidatePath(`/orders/${orderNumber}`)
    revalidatePath('/orders')
    return { status: 'success', message: 'Your order has been cancelled.' }
  } catch (error) {
    if (isAppError(error)) return { status: 'error', message: error.message }
    logger.error({ err: error }, 'customer order cancellation failed')
    return {
      status: 'error',
      message: 'Unable to cancel this order. Please contact customer care for assistance.',
    }
  }
}

export async function requestCustomerReturnAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const orderNumber = String(formData.get('orderNumber') ?? '').trim()
  const orderItemId = String(formData.get('orderItemId') ?? '').trim()
  const reason = String(formData.get('reason') ?? '').trim() as ReturnReason
  const condition = String(formData.get('condition') ?? 'OPENED').trim() as ReturnItemCondition
  const quantity = Math.max(1, Number(formData.get('quantity') ?? 1))
  const description = String(formData.get('description') ?? '').trim()

  if (!orderNumber || !orderItemId || !description) {
    return { status: 'error', message: 'Please provide all required return details.' }
  }

  try {
    await requestReturnAsCustomer({
      orderNumber,
      reason,
      description,
      items: [{ orderItemId, quantity, condition }],
    })
    revalidatePath(`/orders/${orderNumber}`)
    revalidatePath('/orders')
    return {
      status: 'success',
      message: 'Return request submitted. Our customer care team will review within 48 hours.',
    }
  } catch (error) {
    if (isAppError(error)) return { status: 'error', message: error.message }
    logger.error({ err: error }, 'customer return request failed')
    return {
      status: 'error',
      message: 'Unable to submit return request. Please try again or reach out to customer care.',
    }
  }
}
