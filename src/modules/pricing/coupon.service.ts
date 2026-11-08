import 'server-only'

import { z } from 'zod'

import type { Coupon } from '@/generated/prisma/client'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

import { evaluateCoupon, type CouponEvaluation, type CouponLine } from './coupon'

const decimalInput = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value), 'Use a valid amount.')
  .transform((value) => (value === '' ? null : value))

const optionalInt = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '' || value === null) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.trunc(parsed) : Number.NaN
  })
  .refine((value) => value === null || (Number.isInteger(value) && value >= 0), 'Use a whole number.')

const optionalDate = z
  .union([z.string(), z.date()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '' || value === null) return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  })

export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, 'Use at least 3 characters.')
  .max(24, 'Use 24 characters or fewer.')
  .regex(/^[A-Z0-9_-]+$/, 'Use letters, numbers, hyphens or underscores.')

export const couponInputSchema = z
  .object({
    code: couponCodeSchema,
    description: z.string().trim().max(200).optional().default(''),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
    value: decimalInput,
    maxDiscount: decimalInput.optional().default(null),
    minOrderValue: decimalInput.optional().default(null),
    scope: z.enum(['ORDER', 'CATEGORY', 'PRODUCT', 'BRAND', 'FIRST_ORDER']).default('ORDER'),
    categoryId: z.string().trim().optional().nullable().default(null),
    productId: z.string().trim().optional().nullable().default(null),
    brandId: z.string().trim().optional().nullable().default(null),
    firstOrderOnly: z.boolean().default(false),
    startsAt: optionalDate,
    endsAt: optionalDate,
    totalUsageLimit: optionalInt,
    perCustomerLimit: optionalInt,
    stackable: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .superRefine((input, ctx) => {
    if (input.type !== 'FREE_SHIPPING' && input.value === null) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter the discount value.' })
    }
    if (input.type === 'PERCENTAGE' && input.value !== null && Number(input.value) > 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'A percentage discount cannot exceed 100.',
      })
    }
    if (input.scope === 'CATEGORY' && !input.categoryId) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Choose a category.' })
    }
    if (input.scope === 'PRODUCT' && !input.productId) {
      ctx.addIssue({ code: 'custom', path: ['productId'], message: 'Choose a product.' })
    }
    if (input.scope === 'BRAND' && !input.brandId) {
      ctx.addIssue({ code: 'custom', path: ['brandId'], message: 'Choose a brand.' })
    }
    if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'The end must be after the start.' })
    }
  })

export type CouponInput = z.infer<typeof couponInputSchema>

export async function listCoupons(): Promise<Coupon[]> {
  return prisma.coupon.findMany({ orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }] })
}

export async function findCouponById(id: string): Promise<Coupon | null> {
  return prisma.coupon.findUnique({ where: { id } })
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  return prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } })
}

export async function createCoupon(input: CouponInput, actorId: string): Promise<Coupon> {
  const existing = await findCouponByCode(input.code)
  if (existing) throw new ConflictError('A coupon with this code already exists.')

  return prisma.coupon.create({
    data: {
      code: input.code,
      description: input.description || null,
      type: input.type,
      value: input.value ?? '0',
      maxDiscount: input.maxDiscount,
      minOrderValue: input.minOrderValue,
      scope: input.scope,
      categoryId: input.scope === 'CATEGORY' ? input.categoryId : null,
      productId: input.scope === 'PRODUCT' ? input.productId : null,
      brandId: input.scope === 'BRAND' ? input.brandId : null,
      firstOrderOnly: input.firstOrderOnly || input.scope === 'FIRST_ORDER',
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      totalUsageLimit: input.totalUsageLimit,
      perCustomerLimit: input.perCustomerLimit,
      stackable: input.stackable,
      isActive: input.isActive,
      createdBy: actorId,
    },
  })
}

export async function updateCoupon(
  id: string,
  input: CouponInput,
  _actorId: string,
): Promise<Coupon> {
  const existing = await findCouponById(id)
  if (!existing) throw new NotFoundError('That coupon could not be found.')
  if (input.code !== existing.code) {
    const clash = await findCouponByCode(input.code)
    if (clash) throw new ConflictError('A coupon with this code already exists.')
  }

  return prisma.coupon.update({
    where: { id },
    data: {
      code: input.code,
      description: input.description || null,
      type: input.type,
      value: input.value ?? '0',
      maxDiscount: input.maxDiscount,
      minOrderValue: input.minOrderValue,
      scope: input.scope,
      categoryId: input.scope === 'CATEGORY' ? input.categoryId : null,
      productId: input.scope === 'PRODUCT' ? input.productId : null,
      brandId: input.scope === 'BRAND' ? input.brandId : null,
      firstOrderOnly: input.firstOrderOnly || input.scope === 'FIRST_ORDER',
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      totalUsageLimit: input.totalUsageLimit,
      perCustomerLimit: input.perCustomerLimit,
      stackable: input.stackable,
      isActive: input.isActive,
    },
  })
}

export async function setCouponActive(id: string, isActive: boolean): Promise<Coupon> {
  const existing = await findCouponById(id)
  if (!existing) throw new NotFoundError('That coupon could not be found.')
  return prisma.coupon.update({ where: { id }, data: { isActive } })
}

interface OwnerIdentity {
  userId?: string | null
  email?: string | null
}

async function firstOrder(identity: OwnerIdentity): Promise<boolean> {
  if (!identity.userId && !identity.email) return true
  const count = await prisma.order.count({
    where: {
      status: { not: 'CANCELLED' },
      ...(identity.userId
        ? { userId: identity.userId }
        : { email: identity.email!.toLowerCase() }),
    },
  })
  return count === 0
}

async function usageCount(couponId: string, identity: OwnerIdentity): Promise<number> {
  if (!identity.userId && !identity.email) return 0
  return prisma.couponUsage.count({
    where: {
      couponId,
      OR: [
        ...(identity.userId ? [{ userId: identity.userId }] : []),
        ...(identity.email ? [{ email: identity.email.toLowerCase() }] : []),
      ],
    },
  })
}

export async function evaluateCouponForOwner(
  coupon: Coupon,
  input: {
    lines: CouponLine[]
    subtotal: number
    shippingTotal?: number
    userId?: string | null
    email?: string | null
    now?: Date
  },
): Promise<CouponEvaluation> {
  const identity = { userId: input.userId, email: input.email }
  const [isFirstOrder, used] = await Promise.all([
    firstOrder(identity),
    usageCount(coupon.id, identity),
  ])

  return evaluateCoupon(coupon, {
    lines: input.lines,
    subtotal: input.subtotal,
    shippingTotal: input.shippingTotal,
    isFirstOrder,
    usageCount: used,
    now: input.now,
  })
}

/** Validate a coupon code for display/checkout. Returns null when invalid. */
export async function validateCouponCode(
  code: string,
  input: {
    lines: CouponLine[]
    subtotal: number
    shippingTotal?: number
    userId?: string | null
    email?: string | null
  },
): Promise<{ coupon: Coupon; evaluation: CouponEvaluation } | null> {
  const coupon = await findCouponByCode(code)
  if (!coupon) return null
  const evaluation = await evaluateCouponForOwner(coupon, input)
  return { coupon, evaluation }
}

export function assertCouponUsable(evaluation: CouponEvaluation): void {
  if (!evaluation.valid) {
    throw new ValidationError(evaluation.reason ?? 'This coupon cannot be used on this order.')
  }
}
