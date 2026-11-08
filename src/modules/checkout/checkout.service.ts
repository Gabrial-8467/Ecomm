import 'server-only'

import { createHash } from 'node:crypto'

import Decimal from 'decimal.js'
import { z } from 'zod'

import type {
  Address,
  Coupon,
  Order,
  PaymentMethod,
  Prisma,
  Seller,
} from '@/generated/prisma/client'
import { getCurrentActor } from '@/lib/auth/guards'
import { getEnv } from '@/lib/env'
import {
  ConflictError,
  ForbiddenError,
  InsufficientStockError,
  NotFoundError,
  UnprocessableError,
  ValidationError,
} from '@/lib/errors'
import { logger } from '@/lib/logger'
import { gstFromExclusive, gstFromInclusive, roundMoney, type GstBreakdown } from '@/lib/money'
import { sendEmail } from '@/lib/notifications/email'
import { orderConfirmationEmail } from '@/lib/notifications/templates'
import { prisma } from '@/lib/prisma'
import { addressInputSchema, addressSnapshot, createAddress, getAddress } from '@/modules/account/address.service'
import { getCheckoutCartContext, type CartLine, type CartView } from '@/modules/cart/cart.service'
import { grantOrderAccess } from '@/modules/orders/order-access'
import { issueInvoice } from '@/modules/orders/invoice.service'
import { newOrderNumber, releaseOrderStock } from '@/modules/orders/order.service'
import { createRazorpayOrder, razorpayConfigured, verifyCheckoutSignature } from '@/modules/payments/razorpay'
import { evaluateCouponForOwner } from '@/modules/pricing/coupon.service'
import { assertServiceable, quoteShipping, type ShippingQuote } from '@/modules/shipping/shipping.service'

const optionalAddressId = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))

export const checkoutInputSchema = z
  .object({
    addressId: optionalAddressId,
    saveAddress: z.coerce.boolean().default(false),
    fullName: z.string().trim().max(120).optional().default(''),
    phone: z.string().trim().max(20).optional().default(''),
    email: z.string().trim().max(254).optional().default(''),
    line1: z.string().trim().max(160).optional().default(''),
    line2: z.string().trim().max(160).optional().default(''),
    landmark: z.string().trim().max(120).optional().default(''),
    city: z.string().trim().max(80).optional().default(''),
    state: z.string().trim().max(80).optional().default(''),
    pincode: z.string().trim().optional().default(''),
    country: z.string().trim().length(2).default('IN'),
    paymentMethod: z.enum(['RAZORPAY', 'COD']),
    customerNote: z.string().trim().max(1_000).optional().default(''),
    installationRequested: z.coerce.boolean().default(false),
    acceptTerms: z.coerce.boolean().refine((value) => value, 'Accept the terms to place the order.'),
    idempotencyKey: z.string().trim().min(8).max(100),
  })
  .superRefine((input, ctx) => {
    if (input.addressId) return
    const parsed = addressInputSchema.safeParse({
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      line1: input.line1,
      line2: input.line2,
      landmark: input.landmark,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      country: input.country,
    })
    if (parsed.success) return
    for (const issue of parsed.error.issues) {
      ctx.addIssue({
        code: 'custom',
        path: [issue.path[0] ?? 'address'],
        message: issue.message,
      })
    }
  })

export type CheckoutInput = z.infer<typeof checkoutInputSchema>

export interface CheckoutTotals {
  subtotal: number
  discountTotal: number
  taxTotal: number
  shippingTotal: number
  shippingWaived: boolean
  codFee: number
  grandTotal: number
}

export interface CheckoutPaymentOption {
  method: PaymentMethod
  label: string
  available: boolean
  reason: string | null
  fee: number
}

export interface CheckoutView {
  cart: CartView
  isGuest: boolean
  addresses: Address[]
  quote: ShippingQuote | null
  coupon: { code: string; discount: number; freeShipping: boolean; reason: string | null } | null
  totals: CheckoutTotals
  paymentOptions: CheckoutPaymentOption[]
}

interface PricedLine {
  line: CartLine
  discount: Decimal
  gst: GstBreakdown
  payable: Decimal
}

export interface PricedOrder {
  lines: PricedLine[]
  subtotal: Decimal
  discountTotal: Decimal
  taxTotal: Decimal
  goodsPayable: Decimal
  shippingTotal: Decimal
  shippingWaived: boolean
  codFee: Decimal
  grandTotal: Decimal
}

function toNumber(value: Decimal): number {
  return roundMoney(value).toNumber()
}

/**
 * Apply the coupon discount to line values proportionally, then extract GST
 * from the discounted amount. Money is rounded per line, with any remainder
 * assigned to the last line so the sum always equals the order discount.
 */
export function priceOrder(input: {
  lines: CartLine[]
  discount: number
  freeShipping: boolean
  shippingTotal: number
  codFee: number
  isInterState: boolean
}): PricedOrder {
  const subtotal = roundMoney(
    input.lines.reduce((total, line) => total.plus(line.lineTotal), new Decimal(0)),
  )
  const requestedDiscount = Decimal.max(
    0,
    Decimal.min(new Decimal(input.discount), subtotal),
  )

  const lines: PricedLine[] = []
  let allocated = new Decimal(0)
  let remaining = requestedDiscount

  input.lines.forEach((line, index) => {
    const isLast = index === input.lines.length - 1
    const lineTotal = new Decimal(line.lineTotal)
    const proportional =
      subtotal.isZero() || isLast
        ? remaining
        : roundMoney(requestedDiscount.times(lineTotal).dividedBy(subtotal))
    const share = Decimal.min(proportional, lineTotal, remaining)
    allocated = allocated.plus(share)
    remaining = remaining.minus(share)
    const net = Decimal.max(0, lineTotal.minus(share))
    const rate = new Decimal(line.taxRate)
    const gst = line.priceIncludesTax
      ? gstFromInclusive(net, rate, input.isInterState)
      : gstFromExclusive(net, rate, input.isInterState)
    lines.push({
      line,
      discount: share,
      gst,
      payable: line.priceIncludesTax ? net : gst.gross,
    })
  })

  const taxTotal = roundMoney(
    lines.reduce((total, entry) => total.plus(entry.gst.taxAmount), new Decimal(0)),
  )
  const goodsPayable = roundMoney(
    lines.reduce((total, entry) => total.plus(entry.payable), new Decimal(0)),
  )
  const shippingTotal = input.freeShipping ? new Decimal(0) : roundMoney(input.shippingTotal)
  const codFee = roundMoney(input.codFee)
  const grandTotal = roundMoney(goodsPayable.plus(shippingTotal).plus(codFee))

  return {
    lines,
    subtotal,
    discountTotal: allocated,
    taxTotal,
    goodsPayable,
    shippingTotal,
    shippingWaived: input.freeShipping && input.shippingTotal > 0,
    codFee,
    grandTotal,
  }
}

function sellerStateFrom(seller: Seller): string | null {
  const address = seller.registeredAddress
  if (!address || typeof address !== 'object' || Array.isArray(address)) return null
  const state = (address as Record<string, unknown>).state
  return typeof state === 'string' && state.trim() ? state.trim() : null
}

function normaliseState(value: string | null | undefined): string | null {
  if (!value) return null
  return value.trim().toLowerCase().replaceAll('.', '').replace(/\s+/g, ' ')
}

function paymentOptions(input: {
  quote: ShippingQuote | null
  grandTotal: number
}): CheckoutPaymentOption[] {
  const env = getEnv()
  const codFee = new Decimal(env.COD_FEE)
  const codBlockedReason = !input.quote
    ? 'Enter a PIN code to check cash on delivery.'
    : !input.quote.serviceable
      ? 'This PIN code is not serviceable.'
      : !input.quote.codAvailable
        ? 'Cash on delivery is not available for this PIN code.'
        : input.grandTotal + env.COD_FEE > env.COD_MAX_ORDER_VALUE
          ? `Cash on delivery is available only up to ₹${env.COD_MAX_ORDER_VALUE.toLocaleString('en-IN')}.`
          : null

  return [
    {
      method: 'RAZORPAY',
      label: 'Pay online',
      available: razorpayConfigured(),
      reason: razorpayConfigured()
        ? null
        : 'Online payment is not configured for this store yet. Choose cash on delivery where available.',
      fee: 0,
    },
    {
      method: 'COD',
      label: 'Cash on delivery',
      available: codBlockedReason === null,
      reason: codBlockedReason,
      fee: codFee.toNumber(),
    },
  ]
}

export async function getCheckoutView(input: {
  pincode?: string | null
} = {}): Promise<CheckoutView | null> {
  const context = await getCheckoutCartContext()
  if (!context || context.lines.length === 0) return null

  const actor = await getCurrentActor()
  const addresses = context.userId
    ? await prisma.address.findMany({
        where: { userId: context.userId, deletedAt: null },
        orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'desc' }],
      })
    : []

  const availableLines = context.lines.filter((line) => line.available)
  const quote = input.pincode
    ? await quoteShipping({
        pincode: input.pincode,
        subtotal: context.view.subtotal,
        lines: availableLines.map((line) => ({
          quantity: line.quantity,
          shippingClass: line.shippingClass,
        })),
      })
    : null

  let couponView: CheckoutView['coupon'] = null
  let discount = 0
  let freeShipping = false
  if (context.coupon) {
    const evaluation = await evaluateCouponForOwner(context.coupon, {
      lines: availableLines.map((line) => ({
        productId: line.productId,
        categoryId: line.categoryId,
        brandId: line.brandId,
        lineTotal: line.lineTotal,
        quantity: line.quantity,
      })),
      subtotal: context.view.subtotal,
      userId: context.userId,
      email: actor?.email ?? context.email,
    })
    if (evaluation.valid) {
      discount = evaluation.discount
      freeShipping = evaluation.freeShipping
    }
    couponView = {
      code: context.coupon.code,
      discount: evaluation.discount,
      freeShipping: evaluation.freeShipping,
      reason: evaluation.valid ? null : evaluation.reason,
    }
  }

  const priced = priceOrder({
    lines: availableLines,
    discount,
    freeShipping,
    shippingTotal: quote?.shippingTotal ?? 0,
    codFee: 0,
    isInterState: false,
  })

  const totals: CheckoutTotals = {
    subtotal: toNumber(priced.subtotal),
    discountTotal: toNumber(priced.discountTotal),
    taxTotal: toNumber(priced.taxTotal),
    shippingTotal: toNumber(priced.shippingTotal),
    shippingWaived: priced.shippingWaived,
    codFee: 0,
    grandTotal: toNumber(priced.grandTotal),
  }

  return {
    cart: context.view,
    isGuest: context.userId === null,
    addresses,
    quote,
    coupon: couponView,
    totals,
    paymentOptions: paymentOptions({ quote, grandTotal: totals.grandTotal }),
  }
}

export interface PlaceOrderSuccess {
  orderNumber: string
  orderId: string
  grandTotal: number
  paymentMethod: PaymentMethod
  requiresPayment: boolean
  razorpay: {
    keyId: string
    providerOrderId: string
    amountPaise: number
    name: string
    description: string
    prefill: { name: string; email: string; contact: string }
  } | null
}

function requestHash(input: {
  cartId: string
  pincode: string
  method: PaymentMethod
  addressLine: string
}): string {
  return createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
}

async function reserveStock(
  tx: Prisma.TransactionClient,
  input: {
    line: CartLine
    orderId: string
    orderNumber: string
    preferredWarehouseId: string | null
  },
): Promise<{ warehouseId: string }> {
  const rows = await tx.inventory.findMany({
    where: { variantId: input.line.variantId, warehouse: { isActive: true } },
    include: { warehouse: { select: { id: true, isDefault: true, priority: true } } },
    orderBy: [{ warehouse: { isDefault: 'desc' } }, { warehouse: { priority: 'desc' } }],
  })

  const candidates = rows.filter(
    (row) => row.onHand - row.reserved - row.damaged >= input.line.quantity,
  )
  const chosen =
    candidates.find((row) => row.warehouseId === input.preferredWarehouseId) ?? candidates[0]
  if (!chosen) {
    throw new InsufficientStockError(
      `${input.line.productName} no longer has ${input.line.quantity} in stock.`,
    )
  }

  const affected = await tx.$executeRaw`
    UPDATE "Inventory"
    SET "reserved" = "reserved" + ${input.line.quantity}, "updatedAt" = NOW()
    WHERE "id" = ${chosen.id}
      AND ("onHand" - "reserved" - "damaged") >= ${input.line.quantity}
  `
  if (affected !== 1) {
    throw new InsufficientStockError(
      `${input.line.productName} no longer has ${input.line.quantity} in stock.`,
    )
  }

  const reservedAfter = chosen.reserved + input.line.quantity
  await tx.stockReservation.create({
    data: {
      variantId: input.line.variantId,
      warehouseId: chosen.warehouseId,
      quantity: input.line.quantity,
      orderId: input.orderId,
      status: 'CONFIRMED',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000),
      idempotencyKey: `${input.orderNumber}:${input.line.variantId}:${chosen.warehouseId}`,
    },
  })
  await tx.stockMovement.create({
    data: {
      variantId: input.line.variantId,
      warehouseId: chosen.warehouseId,
      type: 'SALE_RESERVED',
      quantity: -input.line.quantity,
      onHandAfter: chosen.onHand,
      reservedAfter,
      referenceType: 'Order',
      referenceId: input.orderId,
      reason: 'Stock reserved for order',
    },
  })

  return { warehouseId: chosen.warehouseId }
}

async function allocateCoupon(
  tx: Prisma.TransactionClient,
  input: {
    coupon: Coupon
    orderId: string
    userId: string | null
    email: string
    discount: number
  },
): Promise<void> {
  const updated = await tx.$executeRaw`
    UPDATE "Coupon"
    SET "usedCount" = "usedCount" + 1, "updatedAt" = NOW()
    WHERE "id" = ${input.coupon.id}
      AND ("totalUsageLimit" IS NULL OR "usedCount" < "totalUsageLimit")
  `
  if (updated !== 1) {
    throw new ValidationError('This coupon has reached its usage limit.')
  }
  await tx.couponUsage.create({
    data: {
      couponId: input.coupon.id,
      orderId: input.orderId,
      userId: input.userId,
      email: input.email,
      discountAmount: input.discount.toFixed(2),
    },
  })
}

async function loadSeller(sellerId: string): Promise<Seller> {
  const seller = await prisma.seller.findUnique({ where: { id: sellerId } })
  if (!seller) throw new NotFoundError('The seller for this order could not be found.')
  if (seller.status !== 'ACTIVE') {
    throw new UnprocessableError('This seller is not accepting orders right now.')
  }
  return seller
}

/**
 * Place an order from the current cart. Everything that affects money or stock
 * happens inside one database transaction. Idempotency keys make double-submit
 * return the original order instead of charging/reserving twice.
 */
export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderSuccess> {
  const parsed = checkoutInputSchema.parse(input)
  const context = await getCheckoutCartContext()
  if (!context || context.lines.length === 0) {
    throw new ValidationError('Your cart is empty.')
  }
  if (context.lines.some((line) => !line.available)) {
    throw new ValidationError(
      'Remove the unavailable item from your cart before placing the order.',
    )
  }

  const actor = await getCurrentActor()
  if (parsed.addressId && !context.userId) {
    throw new ForbiddenError('Sign in to use a saved address.')
  }

  let address: Address | null = null
  let snapshot: Omit<ReturnType<typeof addressSnapshot>, 'id' | 'label'> & {
    id: string | null
    label: string | null
  }
  if (parsed.addressId) {
    address = await getAddress(context.userId!, parsed.addressId)
    snapshot = addressSnapshot(address)
  } else {
    snapshot = {
      id: null,
      label: null,
      fullName: parsed.fullName,
      phone: parsed.phone,
      email: parsed.email || null,
      line1: parsed.line1,
      line2: parsed.line2 || null,
      landmark: parsed.landmark || null,
      city: parsed.city,
      state: parsed.state,
      pincode: parsed.pincode,
      country: parsed.country,
    }
  }

  const sellerIds = [...new Set(context.lines.map((line) => line.sellerId))]
  if (sellerIds.length !== 1) {
    throw new ValidationError(
      'This cart contains items from more than one seller. Please order them separately.',
    )
  }
  const seller = await loadSeller(sellerIds[0]!)

  if (parsed.installationRequested && !context.lines.some((line) => line.installationRequired)) {
    throw new ValidationError('None of the items in this cart need installation.')
  }

  const quote = await quoteShipping({
    pincode: snapshot.pincode,
    subtotal: context.view.subtotal,
    lines: context.lines.map((line) => ({
      quantity: line.quantity,
      shippingClass: line.shippingClass,
    })),
    paymentMethod: parsed.paymentMethod,
  })
  assertServiceable(quote)

  if (parsed.installationRequested && !quote.installationAvailable) {
    throw new ValidationError('Installation is not available for this PIN code yet.')
  }
  let discount = 0
  let freeShipping = false
  if (context.coupon) {
    const evaluation = await evaluateCouponForOwner(context.coupon, {
      lines: context.lines.map((line) => ({
        productId: line.productId,
        categoryId: line.categoryId,
        brandId: line.brandId,
        lineTotal: line.lineTotal,
        quantity: line.quantity,
      })),
      subtotal: context.view.subtotal,
      userId: context.userId,
      email: actor?.email ?? context.email,
    })
    if (!evaluation.valid) {
      throw new ValidationError(evaluation.reason ?? 'This coupon can no longer be used.')
    }
    discount = evaluation.discount
    freeShipping = evaluation.freeShipping
  }

  const sellerState = sellerStateFrom(seller)
  const placeOfSupply = snapshot.state
  const isInterState =
    normaliseState(sellerState) !== null &&
    normaliseState(placeOfSupply) !== null &&
    normaliseState(sellerState) !== normaliseState(placeOfSupply)

  const priced = priceOrder({
    lines: context.lines,
    discount,
    freeShipping,
    shippingTotal: quote.shippingTotal,
    codFee: parsed.paymentMethod === 'COD' ? quote.codFee : 0,
    isInterState,
  })

  if (parsed.paymentMethod === 'COD' && !quote.codAvailable) {
    throw new ValidationError('Cash on delivery is not available for this PIN code.')
  }
  if (parsed.paymentMethod === 'COD' && priced.grandTotal.greaterThan(getEnv().COD_MAX_ORDER_VALUE)) {
    throw new ValidationError(
      `Cash on delivery is available only up to ₹${getEnv().COD_MAX_ORDER_VALUE.toLocaleString('en-IN')}.`,
    )
  }

  if (parsed.paymentMethod === 'RAZORPAY' && !razorpayConfigured()) {
    throw new ValidationError('Online payment is not configured for this store yet.')
  }

  const orderNumber = newOrderNumber()
  const hash = requestHash({
    cartId: context.cartId,
    pincode: snapshot.pincode,
    method: parsed.paymentMethod,
    addressLine: `${snapshot.line1}|${snapshot.city}|${snapshot.pincode}`,
  })

  const email = snapshot.email ?? actor?.email ?? context.email
  if (!email) {
    throw new ValidationError('An email address is required so we can send order updates.')
  }

  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { scope_key: { scope: 'checkout', key: parsed.idempotencyKey } },
  })
  if (existingKey) {
    if (existingKey.requestHash !== hash) {
      throw new ConflictError(
        'This checkout attempt was already used with different details. Refresh the page and try again.',
      )
    }
    if (existingKey.status === 'COMPLETED' && existingKey.responseJson) {
      return existingKey.responseJson as unknown as PlaceOrderSuccess
    }
    throw new ConflictError('This checkout is already being processed.')
  }

  const idempotency = await prisma.idempotencyKey.create({
    data: {
      scope: 'checkout',
      key: parsed.idempotencyKey,
      requestHash: hash,
      status: 'IN_PROGRESS',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
    },
    select: { id: true },
  })

  let providerOrderId: string | null = null

  try {
    if (parsed.paymentMethod === 'RAZORPAY') {
      const razorpayOrder = await createRazorpayOrder({
        amountPaise: priced.grandTotal.times(100).toDecimalPlaces(0).toNumber(),
        receipt: orderNumber.replaceAll('-', '').slice(0, 40),
        notes: { orderNumber },
      })
      providerOrderId = razorpayOrder.id
    }

    const result = await prisma.$transaction(async (tx) => {
      // Re-read the cart inside the transaction so a concurrent change cannot
      // be priced using stale quantities.
      const freshItems = await tx.cartItem.findMany({
        where: { cartId: context.cartId },
        select: { variantId: true, quantity: true },
      })
      if (freshItems.length !== context.lines.length) {
        throw new ConflictError('Your cart changed while placing the order. Please review it again.')
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: context.userId,
          sellerId: seller.id,
          email,
          phone: snapshot.phone,
          status: parsed.paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
          paymentStatus: 'PENDING',
          currency: context.currency,
          subtotal: priced.subtotal.toFixed(2),
          discountTotal: priced.discountTotal.toFixed(2),
          couponDiscount: priced.discountTotal.toFixed(2),
          shippingTotal: priced.shippingTotal.toFixed(2),
          codFee: priced.codFee.toFixed(2),
          taxTotal: priced.taxTotal.toFixed(2),
          grandTotal: priced.grandTotal.toFixed(2),
          couponId: context.coupon?.id ?? null,
          couponCode: context.coupon?.code ?? null,
          customerSnapshot: {
            userId: context.userId,
            name: snapshot.fullName,
            email,
            phone: snapshot.phone,
            termsAcceptedAt: new Date().toISOString(),
          },
          shippingAddressSnapshot: snapshot as unknown as Prisma.InputJsonValue,
          sellerSnapshot: {
            id: seller.id,
            legalName: seller.legalName,
            displayName: seller.displayName,
            gstin: seller.gstin,
            customerCareEmail: seller.customerCareEmail,
            customerCarePhone: seller.customerCarePhone,
            registeredAddress: seller.registeredAddress,
          } as Prisma.InputJsonValue,
          placeOfSupplyState: placeOfSupply,
          sellerState,
          isInterState,
          shippingMethod: 'STANDARD',
          deliveryType: parsed.installationRequested ? 'INSTALLATION' : 'STANDARD',
          expectedDeliveryDate: quote.estimatedDeliveryDate
            ? new Date(`${quote.estimatedDeliveryDate}T00:00:00.000Z`)
            : null,
          installationRequested: parsed.installationRequested,
          customerNote: parsed.customerNote || null,
        },
      })

      for (const entry of priced.lines) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: entry.line.productId,
            variantId: entry.line.variantId,
            productName: entry.line.productName,
            variantName: entry.line.variantName,
            sku: entry.line.sku,
            hsnCode: entry.line.hsnCode,
            imageUrl: entry.line.image?.url ?? null,
            quantity: entry.line.quantity,
            unitPrice: entry.line.unitPrice.toFixed(2),
            unitMrp: entry.line.unitMrp.toFixed(2),
            discountAmount: entry.discount.toFixed(2),
            taxableValue: entry.gst.taxableValue.toFixed(2),
            taxRate: entry.gst.rate.toFixed(2),
            cgst: entry.gst.cgst.toFixed(2),
            sgst: entry.gst.sgst.toFixed(2),
            igst: entry.gst.igst.toFixed(2),
            lineTotal: entry.payable.toFixed(2),
          },
          select: { id: true },
        })
        await reserveStock(tx, {
          line: entry.line,
          orderId: order.id,
          orderNumber: order.orderNumber,
          preferredWarehouseId: quote.warehouseId,
        })
        void orderItem
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: 'PENDING',
          note: 'Order created',
          changedByUserId: context.userId,
        },
      })
      if (parsed.paymentMethod === 'COD') {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: 'PENDING',
            toStatus: 'CONFIRMED',
            note: 'Cash on delivery order confirmed',
            changedByUserId: context.userId,
          },
        })
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          method: parsed.paymentMethod,
          status: 'PENDING',
          amount: priced.grandTotal.toFixed(2),
          currency: context.currency,
          providerOrderId,
          idempotencyKey: `payment:${order.id}`,
        },
      })

      if (context.coupon) {
        await allocateCoupon(tx, {
          coupon: context.coupon,
          orderId: order.id,
          userId: context.userId,
          email,
          discount: discount,
        })
      }

      await tx.cart.update({
        where: { id: context.cartId },
        data: { status: 'CONVERTED', couponId: null },
      })

      if (parsed.paymentMethod === 'COD') {
        const items = await tx.orderItem.findMany({ where: { orderId: order.id } })
        await issueInvoice(tx, {
          order,
          items,
          sellerGstin: seller.gstin,
          placeOfSupply,
        })
      }

      return order
    })

    const success: PlaceOrderSuccess = {
      orderNumber: result.orderNumber,
      orderId: result.id,
      grandTotal: priced.grandTotal.toNumber(),
      paymentMethod: parsed.paymentMethod,
      requiresPayment: parsed.paymentMethod === 'RAZORPAY',
      razorpay:
        parsed.paymentMethod === 'RAZORPAY' && providerOrderId
          ? {
              keyId: getEnv().RAZORPAY_KEY_ID!,
              providerOrderId,
              amountPaise: priced.grandTotal.times(100).toDecimalPlaces(0).toNumber(),
              name: getEnv().APP_NAME,
              description: `Order ${result.orderNumber}`,
              prefill: { name: snapshot.fullName, email, contact: snapshot.phone },
            }
          : null,
    }

    await prisma.idempotencyKey.update({
      where: { id: idempotency.id },
      data: {
        status: 'COMPLETED',
        statusCode: 201,
        responseJson: success as unknown as Prisma.InputJsonValue,
      },
    })

    if (parsed.saveAddress && context.userId && !parsed.addressId) {
      try {
        await createAddress(context.userId, {
          label: '',
          fullName: snapshot.fullName,
          phone: snapshot.phone,
          email: snapshot.email ?? '',
          line1: snapshot.line1,
          line2: snapshot.line2 ?? '',
          landmark: snapshot.landmark ?? '',
          city: snapshot.city,
          state: snapshot.state,
          pincode: snapshot.pincode,
          country: snapshot.country,
          type: 'BOTH',
          isDefaultShipping: false,
        })
      } catch (error) {
        logger.warn({ err: error }, 'could not save checkout address')
      }
    }

    if (!context.userId) await grantOrderAccess(result.id)

    if (parsed.paymentMethod === 'COD') {
      await sendOrderConfirmation(result.orderNumber)
    }

    return success
  } catch (error) {
    await prisma.idempotencyKey.delete({ where: { id: idempotency.id } }).catch(() => undefined)
    throw error
  }
}

async function sendOrderConfirmation(orderNumber: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, payments: { orderBy: { createdAt: 'asc' }, take: 1 } },
    })
    if (!order) return
    const template = orderConfirmationEmail({
      orderNumber: order.orderNumber,
      email: order.email,
      total: order.grandTotal.toString(),
      paymentMethod: order.payments?.[0]?.method,
      items: order.items.map((item) => ({
        name: `${item.productName} — ${item.variantName}`,
        quantity: item.quantity,
        lineTotal: item.lineTotal.toString(),
      })),
      viewUrl: `${getEnv().APP_URL.replace(/\/$/, '')}/orders/${encodeURIComponent(order.orderNumber)}`,
    })
    await sendEmail({ to: order.email, ...template })
  } catch (error) {
    logger.error({ err: error, orderNumber }, 'order confirmation email failed')
  }
}

export interface PaymentVerificationInput {
  orderNumber: string
  razorpayOrderId: string
  razorpayPaymentId: string
  signature: string | null
}

/**
 * Verify a Razorpay checkout callback and confirm the order. Signature
 * verification is mandatory unless the caller is the verified webhook path.
 */
export async function finalizeRazorpayPayment(
  input: PaymentVerificationInput & { trustedWebhook?: boolean },
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNumber: input.orderNumber },
    include: { payments: true, items: true },
  })
  if (!order) throw new NotFoundError('That order could not be found.')
  const payment = order.payments.find((row) => row.method === 'RAZORPAY')
  if (!payment) throw new ConflictError('This order has no online payment to verify.')

  if (payment.status === 'PAID') return
  if (payment.providerOrderId && payment.providerOrderId !== input.razorpayOrderId) {
    throw new ValidationError('The payment does not match this order.')
  }
  if (!input.trustedWebhook) {
    const valid = verifyCheckoutSignature({
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      signature: input.signature ?? '',
    })
    if (!valid) {
      throw new ValidationError('Payment verification failed. No money has been confirmed.')
    }
  }

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findUnique({ where: { id: payment.id } })
    if (!fresh || fresh.status === 'PAID') return

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        providerPaymentId: input.razorpayPaymentId,
        capturedAt: new Date(),
        rawSummary: { verifiedAt: new Date().toISOString() },
      },
    })
    await tx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'CAPTURED',
        amount: payment.amount,
        providerReference: input.razorpayPaymentId,
        signatureVerified: !input.trustedWebhook,
      },
    })
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        amountPaid: payment.amount,
        status: 'CONFIRMED',
      },
    })
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'CONFIRMED',
        note: 'Online payment captured',
      },
    })

    const seller = await tx.seller.findUnique({ where: { id: order.sellerId } })
    await issueInvoice(tx, {
      order: updated,
      items: await tx.orderItem.findMany({ where: { orderId: order.id } }),
      sellerGstin: seller?.gstin ?? null,
      placeOfSupply: order.placeOfSupplyState,
    })
  })

  await sendOrderConfirmation(order.orderNumber)
}

/** Record a failed online payment without pretending stock or money moved. */
export async function markRazorpayPaymentFailed(input: {
  orderNumber: string
  reason?: string | null
}): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNumber: input.orderNumber },
    include: { payments: true },
  })
  if (!order) return
  const payment = order.payments.find((row) => row.method === 'RAZORPAY')
  if (!payment || payment.status === 'PAID') return

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureMessage: input.reason?.slice(0, 500) ?? 'Payment was not completed.',
      },
    })
    await tx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'FAILED',
        amount: payment.amount,
      },
    })
    if (order.status === 'PENDING') {
      await releaseOrderStock(tx, order.id)
      await tx.order.update({ where: { id: order.id }, data: { status: 'FAILED' } })
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'FAILED',
          note: 'Payment was not completed',
        },
      })
    }
  })
}

/** Retry an online payment for an existing pending order. */
export async function retryRazorpayPayment(orderNumber: string): Promise<PlaceOrderSuccess> {
  if (!razorpayConfigured()) {
    throw new ValidationError('Online payment is not configured for this store yet.')
  }
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payments: true },
  })
  if (!order) throw new NotFoundError('That order could not be found.')
  if (order.status !== 'PENDING' || order.paymentStatus === 'PAID') {
    throw new ConflictError('This order is not awaiting an online payment.')
  }
  const payment = order.payments.find((row) => row.method === 'RAZORPAY')
  if (!payment) throw new ConflictError('This order has no online payment to retry.')

  let providerOrderId = payment.providerOrderId
  if (!providerOrderId) {
    const created = await createRazorpayOrder({
      amountPaise: new Decimal(payment.amount.toString()).times(100).toDecimalPlaces(0).toNumber(),
      receipt: order.orderNumber.replaceAll('-', '').slice(0, 40),
      notes: { orderNumber: order.orderNumber },
    })
    providerOrderId = created.id
    await prisma.payment.update({ where: { id: payment.id }, data: { providerOrderId } })
  }

  return {
    orderNumber: order.orderNumber,
    orderId: order.id,
    grandTotal: new Decimal(order.grandTotal.toString()).toNumber(),
    paymentMethod: 'RAZORPAY',
    requiresPayment: true,
    razorpay: {
      keyId: getEnv().RAZORPAY_KEY_ID!,
      providerOrderId,
      amountPaise: new Decimal(payment.amount.toString()).times(100).toDecimalPlaces(0).toNumber(),
      name: getEnv().APP_NAME,
      description: `Order ${order.orderNumber}`,
      prefill: {
        name: order.shippingAddressSnapshot && typeof order.shippingAddressSnapshot === 'object'
          ? String((order.shippingAddressSnapshot as Record<string, unknown>).fullName ?? '')
          : '',
        email: order.email,
        contact: order.phone,
      },
    },
  }
}

export async function getOrderSummaryForPayment(orderNumber: string): Promise<{
  orderNumber: string
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: string
} | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payments: true },
  })
  if (!order) return null
  return {
    orderNumber: order.orderNumber,
    total: new Decimal(order.grandTotal.toString()).toNumber(),
    paymentMethod: order.payments[0]?.method ?? 'RAZORPAY',
    paymentStatus: order.paymentStatus,
  }
}

export type CheckoutOrder = Order
