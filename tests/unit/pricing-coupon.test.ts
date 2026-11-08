import { describe, expect, it } from 'vitest'

import { evaluateCoupon, type CouponContext, type CouponRules } from '@/modules/pricing/coupon'

describe('evaluateCoupon', () => {
  const baseCoupon: CouponRules = {
    code: 'FESTIVE10',
    type: 'PERCENTAGE',
    value: '10',
    maxDiscount: '500',
    minOrderValue: '1000',
    scope: 'ORDER',
    categoryId: null,
    productId: null,
    brandId: null,
    firstOrderOnly: false,
    startsAt: null,
    endsAt: null,
    totalUsageLimit: null,
    perCustomerLimit: null,
    usedCount: 0,
    isActive: true,
  }

  const sampleContext: CouponContext = {
    lines: [
      {
        productId: 'prod-1',
        categoryId: 'cat-sofas',
        brandId: 'brand-1',
        lineTotal: 4000,
        quantity: 1,
      },
      {
        productId: 'prod-2',
        categoryId: 'cat-tables',
        brandId: 'brand-2',
        lineTotal: 2000,
        quantity: 2,
      },
    ],
    subtotal: 6000,
    shippingTotal: 99,
    isFirstOrder: false,
    usageCount: 0,
  }

  it('calculates percentage discount on order subtotal up to max discount cap', () => {
    // 10% of 6000 is 600, capped at maxDiscount 500
    const result = evaluateCoupon(baseCoupon, sampleContext)
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(500)
    expect(result.freeShipping).toBe(false)
    expect(result.eligibleSubtotal).toBe(6000)
  })

  it('rejects coupon when subtotal is below minimum order value', () => {
    const context: CouponContext = {
      ...sampleContext,
      lines: [{ productId: 'prod-1', categoryId: 'cat-sofas', brandId: null, lineTotal: 500, quantity: 1 }],
      subtotal: 500,
    }
    const result = evaluateCoupon(baseCoupon, context)
    expect(result.valid).toBe(false)
    expect(result.discount).toBe(0)
    expect(result.reason).toContain('₹1,000')
  })

  it('applies fixed amount discount correctly without exceeding eligible subtotal', () => {
    const fixedCoupon: CouponRules = {
      ...baseCoupon,
      code: 'FLAT250',
      type: 'FIXED_AMOUNT',
      value: '250',
      maxDiscount: null,
      minOrderValue: '1000',
    }
    const result = evaluateCoupon(fixedCoupon, sampleContext)
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(250)
    expect(result.freeShipping).toBe(false)
  })

  it('applies free shipping coupon correctly', () => {
    const freeShippingCoupon: CouponRules = {
      ...baseCoupon,
      code: 'FREESHIP',
      type: 'FREE_SHIPPING',
      value: '0',
      maxDiscount: null,
      minOrderValue: '500',
    }
    const result = evaluateCoupon(freeShippingCoupon, sampleContext)
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(0)
    expect(result.freeShipping).toBe(true)
  })

  it('scopes discount only to items in eligible category', () => {
    const categoryCoupon: CouponRules = {
      ...baseCoupon,
      code: 'SOFA20',
      type: 'PERCENTAGE',
      value: '20',
      maxDiscount: null,
      minOrderValue: null,
      scope: 'CATEGORY',
      categoryId: 'cat-sofas',
    }
    // Only line 1 (4000) is in cat-sofas. 20% of 4000 = 800
    const result = evaluateCoupon(categoryCoupon, sampleContext)
    expect(result.valid).toBe(true)
    expect(result.eligibleSubtotal).toBe(4000)
    expect(result.discount).toBe(800)
  })

  it('rejects category scoped coupon when cart contains no eligible items', () => {
    const categoryCoupon: CouponRules = {
      ...baseCoupon,
      code: 'BEDS15',
      type: 'PERCENTAGE',
      value: '15',
      scope: 'CATEGORY',
      categoryId: 'cat-beds',
    }
    const result = evaluateCoupon(categoryCoupon, sampleContext)
    expect(result.valid).toBe(false)
    expect(result.discount).toBe(0)
    expect(result.reason).toContain('the selected category')
  })

  it('rejects first order only coupon for returning customers', () => {
    const firstOrderCoupon: CouponRules = {
      ...baseCoupon,
      code: 'WELCOME100',
      type: 'FIXED_AMOUNT',
      value: '100',
      firstOrderOnly: true,
      scope: 'FIRST_ORDER',
    }
    const result = evaluateCoupon(firstOrderCoupon, { ...sampleContext, isFirstOrder: false })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('first order')
  })

  it('allows first order coupon for new customers', () => {
    const firstOrderCoupon: CouponRules = {
      ...baseCoupon,
      code: 'WELCOME100',
      type: 'FIXED_AMOUNT',
      value: '100',
      firstOrderOnly: true,
      scope: 'FIRST_ORDER',
    }
    const result = evaluateCoupon(firstOrderCoupon, { ...sampleContext, isFirstOrder: true })
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(100)
  })

  it('rejects expired coupon', () => {
    const expiredCoupon: CouponRules = {
      ...baseCoupon,
      endsAt: new Date(Date.now() - 3600_000), // 1 hour ago
    }
    const result = evaluateCoupon(expiredCoupon, sampleContext)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('expired')
  })

  it('rejects coupon when per-customer usage limit is reached', () => {
    const limitedCoupon: CouponRules = {
      ...baseCoupon,
      perCustomerLimit: 1,
    }
    const result = evaluateCoupon(limitedCoupon, { ...sampleContext, usageCount: 1 })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('maximum number of times')
  })
})
