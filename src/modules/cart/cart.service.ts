import 'server-only'

import Decimal from 'decimal.js'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'

import { getEnv } from '@/lib/env'
import { InsufficientStockError, NotFoundError, ValidationError } from '@/lib/errors'
import { ensureGuestTokenHash, readGuestTokenHash } from '@/lib/guest-identity'
import { prisma } from '@/lib/prisma'
import { getCurrentActor } from '@/lib/auth/guards'

const CART_TTL_DAYS = 30

const cartInclude = {
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              archivedAt: true,
              priceIncludesTax: true,
              gstRate: true,
              images: {
                where: { isPrimary: true },
                orderBy: { sortOrder: 'asc' },
                take: 1,
                select: { url: true, alt: true },
              },
              category: { select: { isActive: true, archivedAt: true } },
            },
          },
          inventory: { select: { onHand: true, reserved: true, damaged: true } },
        },
      },
    },
  },
} satisfies import('@/generated/prisma/client').Prisma.CartInclude

type CartWithItems = import('@/generated/prisma/client').Prisma.CartGetPayload<{
  include: typeof cartInclude
}>

type CartItemWithVariant = CartWithItems['items'][number]

export interface CartLine {
  id: string
  variantId: string
  productId: string
  productName: string
  productSlug: string
  variantName: string
  sku: string
  image: { url: string; alt: string } | null
  unitPrice: number
  lineTotal: number
  quantity: number
  stock: number
  maxQuantity: number
  available: boolean
  unavailableReason: string | null
}

export interface CartView {
  id: string | null
  items: CartLine[]
  /** Quantities that are currently purchasable and included in the totals. */
  itemCount: number
  /** Every quantity in the cart, including lines awaiting stock. Mirrors the header badge. */
  totalItemCount: number
  subtotal: number
  discountTotal: number
  taxTotal: number
  shippingTotal: number
  grandTotal: number
  currency: string
  isGuest: boolean
}

interface Owner {
  userId: string | null
  guestTokenHash: string | null
}

function toNumber(value: Decimal): number {
  return Number(value.toFixed(2))
}

function availableStock(item: CartItemWithVariant): number {
  return item.variant.inventory.reduce(
    (total, row) => total + Math.max(0, row.onHand - row.reserved - row.damaged),
    0,
  )
}

function isPurchasable(item: CartItemWithVariant): boolean {
  const product = item.variant.product
  return (
    item.variant.isActive &&
    product.status === 'ACTIVE' &&
    product.archivedAt === null &&
    product.category.isActive &&
    product.category.archivedAt === null
  )
}

function emptyCart(isGuest: boolean): CartView {
  return {
    id: null,
    items: [],
    itemCount: 0,
    totalItemCount: 0,
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    shippingTotal: 0,
    grandTotal: 0,
    currency: getEnv().DEFAULT_CURRENCY,
    isGuest,
  }
}

function buildView(cart: CartWithItems, isGuest: boolean): CartView {
  let subtotal = new Decimal(0)
  let taxTotal = new Decimal(0)
  let itemCount = 0
  let totalItemCount = 0
  const items: CartLine[] = cart.items.map((item) => {
    const unitPrice = new Decimal(item.variant.price.toString())
    const lineTotal = unitPrice.times(item.quantity)
    const stock = availableStock(item)
    const product = item.variant.product
    const purchasable = isPurchasable(item)
    const available = purchasable && stock > 0
    const image = product.images[0] ?? null
    const taxRate = new Decimal((item.variant.taxRate ?? product.gstRate ?? 0).toString())

    totalItemCount += item.quantity

    if (available) {
      subtotal = subtotal.plus(lineTotal)
      itemCount += item.quantity
      if (product.priceIncludesTax) {
        if (taxRate.greaterThan(0)) {
          taxTotal = taxTotal.plus(lineTotal.times(taxRate).dividedBy(taxRate.plus(100)))
        }
      } else {
        taxTotal = taxTotal.plus(lineTotal.times(taxRate).dividedBy(100))
      }
    }

    return {
      id: item.id,
      variantId: item.variantId,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantName: item.variant.name,
      sku: item.variant.sku,
      image: image ? { url: image.url, alt: image.alt } : null,
      unitPrice: toNumber(unitPrice),
      lineTotal: toNumber(lineTotal),
      quantity: item.quantity,
      stock,
      maxQuantity: Math.max(1, Math.min(stock, getEnv().CART_MAX_QUANTITY_PER_LINE)),
      available,
      unavailableReason: !purchasable
        ? 'This product is no longer available.'
        : stock <= 0
          ? 'Out of stock.'
          : null,
    }
  })

  const discountTotal = new Decimal(cart.discountTotal.toString())
  const shippingTotal = new Decimal(cart.shippingTotal.toString())
  const taxIncluded = cart.items.every((item) => item.variant.product.priceIncludesTax)
  const grandTotal = subtotal
    .plus(taxIncluded ? 0 : taxTotal)
    .minus(discountTotal)
    .plus(shippingTotal)
    .toDecimalPlaces(2)

  return {
    id: cart.id,
    items,
    itemCount,
    totalItemCount,
    subtotal: toNumber(subtotal),
    discountTotal: toNumber(discountTotal),
    taxTotal: toNumber(taxTotal),
    shippingTotal: toNumber(shippingTotal),
    grandTotal: toNumber(Decimal.max(0, grandTotal)),
    currency: cart.currency,
    isGuest,
  }
}

async function resolveOwner(): Promise<Owner> {
  const actor = await getCurrentActor()
  if (actor) return { userId: actor.userId, guestTokenHash: null }
  return { userId: null, guestTokenHash: await readGuestTokenHash() }
}

async function ensureOwner(): Promise<Owner> {
  const actor = await getCurrentActor()
  if (actor) return { userId: actor.userId, guestTokenHash: null }
  return { userId: null, guestTokenHash: await ensureGuestTokenHash() }
}

function activeCartWhere(owner: Owner) {
  return owner.userId
    ? { userId: owner.userId, status: 'ACTIVE' as const }
    : { guestTokenHash: owner.guestTokenHash, status: 'ACTIVE' as const }
}

async function findActiveCart(owner: Owner): Promise<CartWithItems | null> {
  if (!owner.userId && !owner.guestTokenHash) return null
  const cart = await prisma.cart.findFirst({
    where: activeCartWhere(owner),
    orderBy: { updatedAt: 'desc' },
    include: cartInclude,
  })
  if (!cart) return null
  if (cart.expiresAt && cart.expiresAt.getTime() < Date.now()) {
    await prisma.cart.update({ where: { id: cart.id }, data: { status: 'ABANDONED' } })
    return null
  }
  return cart
}

async function createCart(owner: Owner): Promise<CartWithItems> {
  const expiresAt = new Date(Date.now() + CART_TTL_DAYS * 24 * 60 * 60 * 1_000)
  return prisma.cart.create({
    data: {
      userId: owner.userId,
      guestTokenHash: owner.userId ? null : owner.guestTokenHash,
      currency: getEnv().DEFAULT_CURRENCY,
      expiresAt,
    },
    include: cartInclude,
  })
}

async function ensureCart(owner: Owner): Promise<CartWithItems> {
  const existing = await findActiveCart(owner)
  if (existing) return existing
  return createCart(owner)
}

/** Available stock for one variant, used by product pages before adding to cart. */
export async function getVariantStock(variantId: string): Promise<number> {
  const rows = await prisma.inventory.findMany({
    where: { variantId },
    select: { onHand: true, reserved: true, damaged: true },
  })
  return rows.reduce(
    (total, row) => total + Math.max(0, row.onHand - row.reserved - row.damaged),
    0,
  )
}

async function fetchVariantForCart(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          status: true,
          archivedAt: true,
          category: { select: { isActive: true, archivedAt: true } },
        },
      },
      inventory: { select: { onHand: true, reserved: true, damaged: true } },
    },
  })
  if (!variant) throw new NotFoundError('That product option could not be found.')
  if (
    !variant.isActive ||
    variant.product.status !== 'ACTIVE' ||
    variant.product.archivedAt !== null ||
    !variant.product.category.isActive ||
    variant.product.category.archivedAt !== null
  ) {
    throw new ValidationError('That product is not currently available.')
  }
  const stock = variant.inventory.reduce(
    (total, row) => total + Math.max(0, row.onHand - row.reserved - row.damaged),
    0,
  )
  return { variant, stock }
}

/** Recompute persisted totals from authoritative variant prices. */
async function refreshTotals(cartId: string): Promise<void> {
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude })
  if (!cart) return
  const view = buildView(cart, cart.userId === null)
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal: view.subtotal,
      discountTotal: view.discountTotal,
      taxTotal: view.taxTotal,
      shippingTotal: view.shippingTotal,
      grandTotal: view.grandTotal,
      expiresAt: new Date(Date.now() + CART_TTL_DAYS * 24 * 60 * 60 * 1_000),
    },
  })
}

export const getCartView = cache(async (): Promise<CartView> => {
  const owner = await resolveOwner()
  const cart = await findActiveCart(owner)
  if (!cart) return emptyCart(owner.userId === null)
  return buildView(cart, owner.userId === null)
})

export const getCartCount = cache(async (): Promise<number> => {
  const owner = await resolveOwner()
  if (!owner.userId && !owner.guestTokenHash) return 0
  const result = await prisma.cartItem.aggregate({
    where: {
      cart: {
        ...activeCartWhere(owner),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    },
    _sum: { quantity: true },
  })
  return result._sum.quantity ?? 0
})

export async function addCartItem(
  variantId: string,
  quantity: number,
): Promise<{ message: string; count: number }> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError('Choose a quantity of at least one.')
  }
  if (quantity > getEnv().CART_MAX_QUANTITY_PER_LINE) {
    throw new ValidationError(
      `You can add up to ${getEnv().CART_MAX_QUANTITY_PER_LINE} units of one option.`,
    )
  }

  const { variant, stock } = await fetchVariantForCart(variantId)
  if (stock < 1) throw new InsufficientStockError('This option is out of stock.')
  if (quantity > stock) {
    throw new InsufficientStockError(`Only ${stock} unit${stock === 1 ? '' : 's'} available.`)
  }

  const owner = await ensureOwner()
  const cart = await ensureCart(owner)
  const existing = cart.items.find((item) => item.variantId === variantId)
  const maxQuantity = Math.min(stock, getEnv().CART_MAX_QUANTITY_PER_LINE)
  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, maxQuantity)

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId, quantity: nextQuantity },
    })
  }

  await refreshTotals(cart.id)
  revalidatePath('/cart')
  revalidatePath('/products')
  revalidatePath('/products/[slug]', 'page')

  const name = variant.name ? `${variant.product.name} (${variant.name})` : variant.product.name
  return { message: `${name} added to your cart.`, count: nextQuantity }
}

export async function setCartItemQuantity(itemId: string, quantity: number): Promise<string> {
  const owner = await ensureOwner()
  const cart = await findActiveCart(owner)
  if (!cart) throw new NotFoundError('Your cart is empty.')

  const item = cart.items.find((entry) => entry.id === itemId)
  if (!item) throw new NotFoundError('That cart item could not be found.')

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } })
    await refreshTotals(cart.id)
    revalidatePath('/cart')
    return 'Item removed.'
  }

  const { stock } = await fetchVariantForCart(item.variantId)
  const maxQuantity = Math.min(stock, getEnv().CART_MAX_QUANTITY_PER_LINE)
  if (maxQuantity < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } })
    await refreshTotals(cart.id)
    revalidatePath('/cart')
    return 'That option is out of stock and was removed.'
  }
  if (quantity > maxQuantity) {
    throw new InsufficientStockError(
      `Only ${maxQuantity} unit${maxQuantity === 1 ? '' : 's'} can be added.`,
    )
  }

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
  await refreshTotals(cart.id)
  revalidatePath('/cart')
  return 'Cart updated.'
}

export async function removeCartItem(itemId: string): Promise<string> {
  const owner = await ensureOwner()
  const cart = await findActiveCart(owner)
  if (!cart) throw new NotFoundError('Your cart is empty.')
  const item = cart.items.find((entry) => entry.id === itemId)
  if (!item) throw new NotFoundError('That cart item could not be found.')
  await prisma.cartItem.delete({ where: { id: item.id } })
  await refreshTotals(cart.id)
  revalidatePath('/cart')
  return 'Item removed.'
}

export async function clearCart(): Promise<string> {
  const owner = await ensureOwner()
  const cart = await findActiveCart(owner)
  if (!cart) return 'Your cart is already empty.'
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  await refreshTotals(cart.id)
  revalidatePath('/cart')
  return 'Cart cleared.'
}

/**
 * Merge a guest cart into the signed-in customer's cart after login. Quantities
 * are capped to current stock; the guest cart is retained as MERGED for audit.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const guestTokenHash = await readGuestTokenHash()
  if (!guestTokenHash) return

  const guestCart = await prisma.cart.findFirst({
    where: { guestTokenHash, status: 'ACTIVE' },
    include: { items: { include: { variant: { include: { inventory: true } } } } },
  })
  if (!guestCart || guestCart.items.length === 0) return

  const userCart =
    (await prisma.cart.findFirst({ where: { userId, status: 'ACTIVE' } })) ??
    (await prisma.cart.create({
      data: {
        userId,
        currency: getEnv().DEFAULT_CURRENCY,
        expiresAt: new Date(Date.now() + CART_TTL_DAYS * 24 * 60 * 60 * 1_000),
      },
    }))

  for (const item of guestCart.items) {
    const stock = item.variant.inventory.reduce(
      (total, row) => total + Math.max(0, row.onHand - row.reserved - row.damaged),
      0,
    )
    if (stock < 1) continue
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
    })
    const quantity = Math.min(
      (existing?.quantity ?? 0) + item.quantity,
      stock,
      getEnv().CART_MAX_QUANTITY_PER_LINE,
    )
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } })
    } else {
      await prisma.cartItem.create({
        data: { cartId: userCart.id, variantId: item.variantId, quantity },
      })
    }
  }

  await prisma.cart.update({
    where: { id: guestCart.id },
    data: { status: 'MERGED', mergedIntoId: userCart.id },
  })
  await refreshTotals(userCart.id)
}
