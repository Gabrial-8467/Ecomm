import Decimal from 'decimal.js'

import type { CouponScope, CouponType } from '@/generated/prisma/client'
import { formatINR, roundMoney } from '@/lib/money'

/**
 * Pure coupon evaluation. Kept free of Prisma and React so the same rules run
 * in the cart, the checkout quote, the order transaction and unit tests.
 *
 * Discounts are applied to the tax-inclusive line value, matching how prices
 * are displayed to customers. GST is extracted afterwards from the discounted
 * line, so the invoice never charges tax on money the customer did not pay.
 */

export interface CouponLine {
  productId: string
  categoryId: string
  brandId: string | null
  lineTotal: number
  quantity: number
}

export interface CouponContext {
  lines: CouponLine[]
  subtotal: number
  shippingTotal?: number
  isFirstOrder: boolean
  /** How many times this customer already used the coupon. */
  usageCount: number
  now?: Date
}

export interface CouponEvaluation {
  valid: boolean
  reason: string | null
  /** Money taken off the order subtotal. Never exceeds the eligible value. */
  discount: number
  /** True when the coupon waives the shipping fee instead of discounting goods. */
  freeShipping: boolean
  /** Value of the lines the coupon applies to. */
  eligibleSubtotal: number
}

export interface CouponRules {
  code: string
  type: CouponType
  value: Decimal.Value
  maxDiscount: Decimal.Value | null
  minOrderValue: Decimal.Value | null
  scope: CouponScope
  categoryId: string | null
  productId: string | null
  brandId: string | null
  firstOrderOnly: boolean
  startsAt: Date | null
  endsAt: Date | null
  totalUsageLimit: number | null
  perCustomerLimit: number | null
  usedCount: number
  isActive: boolean
}

function invalid(reason: string, eligibleSubtotal = 0): CouponEvaluation {
  return { valid: false, reason, discount: 0, freeShipping: false, eligibleSubtotal }
}

function scopeMatches(coupon: CouponRules, line: CouponLine): boolean {
  switch (coupon.scope) {
    case 'ORDER':
    case 'FIRST_ORDER':
      return true
    case 'CATEGORY':
      return coupon.categoryId !== null && line.categoryId === coupon.categoryId
    case 'PRODUCT':
      return coupon.productId !== null && line.productId === coupon.productId
    case 'BRAND':
      return coupon.brandId !== null && line.brandId === coupon.brandId
    default:
      return false
  }
}

const SCOPE_LABELS: Record<CouponScope, string> = {
  ORDER: 'this order',
  FIRST_ORDER: 'a first order',
  CATEGORY: 'the selected category',
  PRODUCT: 'the selected product',
  BRAND: 'the selected brand',
}

export function evaluateCoupon(coupon: CouponRules, context: CouponContext): CouponEvaluation {
  const now = context.now ?? new Date()

  if (!coupon.isActive) return invalid('This coupon is no longer active.')
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    return invalid('This coupon is not active yet.')
  }
  if (coupon.endsAt && coupon.endsAt.getTime() < now.getTime()) {
    return invalid('This coupon has expired.')
  }
  if (coupon.totalUsageLimit !== null && coupon.usedCount >= coupon.totalUsageLimit) {
    return invalid('This coupon has reached its usage limit.')
  }
  if (coupon.perCustomerLimit !== null && context.usageCount >= coupon.perCustomerLimit) {
    return invalid('You have already used this coupon the maximum number of times.')
  }
  if ((coupon.firstOrderOnly || coupon.scope === 'FIRST_ORDER') && !context.isFirstOrder) {
    return invalid('This coupon is only valid on a first order.')
  }
  if (coupon.minOrderValue !== null) {
    const minimum = new Decimal(coupon.minOrderValue.toString())
    if (new Decimal(context.subtotal).lessThan(minimum)) {
      return invalid(`Add goods worth ${formatINR(minimum)} or more to use this coupon.`)
    }
  }

  const eligibleLines = context.lines.filter((line) => scopeMatches(coupon, line))
  const eligibleSubtotal = eligibleLines.reduce(
    (total, line) => total.plus(new Decimal(line.lineTotal)),
    new Decimal(0),
  )

  if (eligibleSubtotal.isZero()) {
    return invalid(`This coupon does not apply to ${SCOPE_LABELS[coupon.scope]}.`, 0)
  }

  if (coupon.type === 'FREE_SHIPPING') {
    return {
      valid: true,
      reason: null,
      discount: 0,
      freeShipping: true,
      eligibleSubtotal: roundMoney(eligibleSubtotal).toNumber(),
    }
  }

  const value = new Decimal(coupon.value.toString())
  let discount =
    coupon.type === 'PERCENTAGE'
      ? eligibleSubtotal.times(value).dividedBy(100)
      : Decimal.min(value, eligibleSubtotal)

  if (coupon.maxDiscount !== null) {
    discount = Decimal.min(discount, new Decimal(coupon.maxDiscount.toString()))
  }

  discount = Decimal.max(0, roundMoney(discount))

  return {
    valid: true,
    reason: null,
    discount: discount.toNumber(),
    freeShipping: false,
    eligibleSubtotal: roundMoney(eligibleSubtotal).toNumber(),
  }
}

export function couponDiscountLabel(type: CouponType): string {
  switch (type) {
    case 'PERCENTAGE':
      return 'Percentage discount'
    case 'FIXED_AMOUNT':
      return 'Fixed amount off'
    case 'FREE_SHIPPING':
      return 'Free shipping'
    default:
      return 'Discount'
  }
}
