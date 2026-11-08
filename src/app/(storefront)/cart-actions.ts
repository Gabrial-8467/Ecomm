'use server'

import { isAppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import {
  addCartItem,
  applyCouponToCart,
  clearCart,
  removeCartItem,
  removeCouponFromCart,
  setCartItemQuantity,
} from '@/modules/cart/cart.service'

export interface CartActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
}

function failure(error: unknown): CartActionState {
  if (isAppError(error)) return { status: 'error', message: error.message }
  logger.error({ err: error }, 'cart action failed')
  return { status: 'error', message: 'Something went wrong. Please try again.' }
}

function positiveInt(value: FormDataEntryValue | null, fallback = 1): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function addToCartAction(
  _previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const variantId = String(formData.get('variantId') ?? '').trim()
  if (!variantId) return { status: 'error', message: 'Choose a product option first.' }

  try {
    const result = await addCartItem(variantId, positiveInt(formData.get('quantity')))
    return { status: 'success', message: result.message }
  } catch (error) {
    return failure(error)
  }
}

export async function updateCartItemAction(
  _previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const itemId = String(formData.get('itemId') ?? '').trim()
  if (!itemId) return { status: 'error', message: 'That cart item could not be found.' }
  try {
    return {
      status: 'success',
      message: await setCartItemQuantity(itemId, positiveInt(formData.get('quantity'))),
    }
  } catch (error) {
    return failure(error)
  }
}

export async function removeCartItemAction(
  _previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const itemId = String(formData.get('itemId') ?? '').trim()
  if (!itemId) return { status: 'error', message: 'That cart item could not be found.' }
  try {
    return { status: 'success', message: await removeCartItem(itemId) }
  } catch (error) {
    return failure(error)
  }
}

export async function clearCartAction(
  _previous: CartActionState,
  _formData: FormData,
): Promise<CartActionState> {
  try {
    return { status: 'success', message: await clearCart() }
  } catch (error) {
    return failure(error)
  }
}

export async function applyCouponAction(
  _previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const code = String(formData.get('code') ?? '').trim()
  if (!code) return { status: 'error', message: 'Enter a coupon code.' }
  try {
    return { status: 'success', message: await applyCouponToCart(code) }
  } catch (error) {
    return failure(error)
  }
}

export async function removeCouponAction(
  _previous: CartActionState,
  _formData: FormData,
): Promise<CartActionState> {
  try {
    return { status: 'success', message: await removeCouponFromCart() }
  } catch (error) {
    return failure(error)
  }
}
