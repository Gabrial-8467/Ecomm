'use server'

import { isAppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import {
  addWishlistProduct,
  moveWishlistItemToCart,
  removeWishlistItem,
  removeWishlistProduct,
  toggleWishlistProduct,
} from '@/modules/wishlist/wishlist.service'

export interface WishlistActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  saved?: boolean
}

function failure(error: unknown): WishlistActionState {
  if (isAppError(error)) return { status: 'error', message: error.message }
  logger.error({ err: error }, 'wishlist action failed')
  return { status: 'error', message: 'Something went wrong. Please try again.' }
}

export async function toggleWishlistAction(
  _previous: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const productId = String(formData.get('productId') ?? '').trim()
  if (!productId) return { status: 'error', message: 'That product could not be found.' }
  try {
    const result = await toggleWishlistProduct(productId)
    return { status: 'success', message: result.message, saved: result.saved }
  } catch (error) {
    return failure(error)
  }
}

export async function addWishlistAction(
  _previous: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const productId = String(formData.get('productId') ?? '').trim()
  if (!productId) return { status: 'error', message: 'That product could not be found.' }
  try {
    const result = await addWishlistProduct(productId)
    return { status: 'success', message: result.message, saved: result.saved }
  } catch (error) {
    return failure(error)
  }
}

export async function removeWishlistProductAction(
  _previous: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const productId = String(formData.get('productId') ?? '').trim()
  if (!productId) return { status: 'error', message: 'That product could not be found.' }
  try {
    const result = await removeWishlistProduct(productId)
    return { status: 'success', message: result.message, saved: result.saved }
  } catch (error) {
    return failure(error)
  }
}

export async function removeWishlistItemAction(
  _previous: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const itemId = String(formData.get('itemId') ?? '').trim()
  if (!itemId) return { status: 'error', message: 'That wishlist item could not be found.' }
  try {
    return { status: 'success', message: await removeWishlistItem(itemId) }
  } catch (error) {
    return failure(error)
  }
}

export async function moveWishlistItemToCartAction(
  _previous: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const itemId = String(formData.get('itemId') ?? '').trim()
  if (!itemId) return { status: 'error', message: 'That wishlist item could not be found.' }
  try {
    const result = await moveWishlistItemToCart(itemId)
    return { status: 'success', message: result.message }
  } catch (error) {
    return failure(error)
  }
}
