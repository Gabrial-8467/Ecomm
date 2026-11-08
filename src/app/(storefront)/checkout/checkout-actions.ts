'use server'

import { revalidatePath } from 'next/cache'

import { isAppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import {
  checkoutInputSchema,
  finalizeRazorpayPayment,
  getCheckoutView,
  placeOrder,
  type CheckoutInput,
  type CheckoutView,
  type PaymentVerificationInput,
  type PlaceOrderSuccess,
} from '@/modules/checkout/checkout.service'

export interface CheckoutQuoteResult {
  status: 'success' | 'error'
  data?: CheckoutView | null
  message?: string
}

export interface PlaceOrderResult {
  status: 'success' | 'error'
  data?: PlaceOrderSuccess
  message?: string
}

export interface FinalizePaymentResult {
  status: 'success' | 'error'
  orderNumber?: string
  message?: string
}

export async function fetchCheckoutQuoteAction(pincode: string): Promise<CheckoutQuoteResult> {
  try {
    const view = await getCheckoutView({ pincode: pincode.trim() })
    return { status: 'success', data: view }
  } catch (error) {
    if (isAppError(error)) return { status: 'error', message: error.message }
    logger.error({ err: error }, 'failed to fetch checkout quote')
    return { status: 'error', message: 'Unable to calculate delivery quote. Check your PIN code.' }
  }
}

export async function placeOrderAction(input: CheckoutInput): Promise<PlaceOrderResult> {
  try {
    const parsed = checkoutInputSchema.parse(input)
    const result = await placeOrder(parsed)
    revalidatePath('/cart')
    revalidatePath('/orders')
    return { status: 'success', data: result }
  } catch (error) {
    if (isAppError(error)) return { status: 'error', message: error.message }
    logger.error({ err: error }, 'order placement failed')
    return { status: 'error', message: 'Unable to place order. Please review your details and try again.' }
  }
}

export async function finalizePaymentAction(
  input: PaymentVerificationInput,
): Promise<FinalizePaymentResult> {
  try {
    await finalizeRazorpayPayment(input)
    revalidatePath(`/orders/${input.orderNumber}`)
    revalidatePath('/orders')
    return { status: 'success', orderNumber: input.orderNumber }
  } catch (error) {
    if (isAppError(error)) return { status: 'error', message: error.message }
    logger.error({ err: error }, 'payment finalization failed')
    return { status: 'error', message: 'Payment verification failed. Please contact support.' }
  }
}
