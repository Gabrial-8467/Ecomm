import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetCacheForTests } from '@/lib/cache'
import { prisma } from '@/lib/prisma'
import { submitContactMessage } from '@/app/(storefront)/contact-actions'
import {
  addCartItem,
  clearCart,
  getCartCount,
  getCartView,
  mergeGuestCartIntoUser,
  removeCartItem,
  setCartItemQuantity,
} from '@/modules/cart/cart.service'
import {
  addWishlistProduct,
  getWishlistCount,
  getWishlistProductIds,
  getWishlistView,
  mergeGuestWishlistIntoUser,
  moveWishlistItemToCart,
  removeWishlistItem,
  removeWishlistProduct,
  toggleWishlistProduct,
} from '@/modules/wishlist/wishlist.service'
import {
  createBrand,
  createCategory,
  createProductFixture,
  createSeller,
} from './catalog-factories'
import { createCustomerUser, resetDatabase } from './factories'

const { cookieJar } = vi.hoisted(() => ({ cookieJar: new Map<string, string>() }))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get(name: string) {
      const value = cookieJar.get(name)
      return value === undefined ? undefined : { name, value }
    },
    set(name: string, value: string) {
      cookieJar.set(name, value)
    },
    delete(name: string) {
      cookieJar.delete(name)
    },
  }),
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.7' }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}))

async function createFixture(stock = 5) {
  const seller = await createSeller()
  const category = await createCategory({
    name: 'Test Furniture',
    slug: `test-furniture-${crypto.randomUUID().slice(0, 6)}`,
  })
  const brand = await createBrand('Test Brand')
  const product = await createProductFixture({
    sellerId: seller.id,
    categoryId: category.id,
    brandId: brand.id,
    name: 'Test Sofa',
    slug: `test-sofa-${crypto.randomUUID().slice(0, 6)}`,
    status: 'ACTIVE',
    publishedAt: new Date(),
    price: '1000.00',
    mrp: '1500.00',
  })
  const variant = product.variants[0]!
  const warehouse = await prisma.warehouse.create({
    data: {
      code: `WH-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Test Warehouse',
      isActive: true,
      isDefault: true,
    },
  })
  await prisma.inventory.create({
    data: { variantId: variant.id, warehouseId: warehouse.id, onHand: stock },
  })
  return { seller, category, brand, product, variant, warehouse }
}

beforeEach(async () => {
  resetCacheForTests()
  cookieJar.clear()
  await resetDatabase()
})

describe('guest cart', () => {
  it('adds, updates and removes items without an account', async () => {
    const { variant } = await createFixture(5)

    const added = await addCartItem(variant.id, 2)
    expect(added.count).toBe(2)
    expect(cookieJar.size).toBe(1)

    const view = await getCartView()
    expect(view.isGuest).toBe(true)
    expect(view.itemCount).toBe(2)
    expect(view.items).toHaveLength(1)
    expect(view.subtotal).toBe(2000)
    expect(view.taxTotal).toBeCloseTo(305.08, 1)
    expect(view.grandTotal).toBe(2000)

    const itemId = view.items[0]!.id
    await setCartItemQuantity(itemId, 3)
    expect(await getCartCount()).toBe(3)
    const updated = await getCartView()
    expect(updated.items[0]!.quantity).toBe(3)
    expect(updated.subtotal).toBe(3000)

    await removeCartItem(itemId)
    expect((await getCartView()).items).toHaveLength(0)
    expect(await getCartCount()).toBe(0)
  })

  it('rejects quantities above available stock', async () => {
    const { variant } = await createFixture(2)

    await expect(addCartItem(variant.id, 3)).rejects.toThrow(/only 2 units/i)
    expect((await getCartView()).items).toHaveLength(0)
  })

  it('caps repeated adds at available stock', async () => {
    const { variant } = await createFixture(3)

    await addCartItem(variant.id, 2)
    const result = await addCartItem(variant.id, 2)
    expect(result.count).toBe(3)
    expect(await getCartCount()).toBe(3)
  })

  it('keeps the header badge and cart page counts consistent when a line goes out of stock', async () => {
    const { variant } = await createFixture(2)
    await addCartItem(variant.id, 2)

    await prisma.inventory.updateMany({ where: { variantId: variant.id }, data: { onHand: 0 } })

    const view = await getCartView()
    expect(view.items[0]!.available).toBe(false)
    expect(view.itemCount).toBe(0)
    expect(view.totalItemCount).toBe(2)
    expect(await getCartCount()).toBe(2)
    expect(view.subtotal).toBe(0)
  })

  it('clears the cart', async () => {
    const { variant } = await createFixture()
    await addCartItem(variant.id, 1)
    await clearCart()
    expect((await getCartView()).items).toHaveLength(0)
  })
})

describe('guest wishlist', () => {
  it('adds, toggles and removes a product without an account', async () => {
    const { product } = await createFixture()

    const added = await addWishlistProduct(product.id)
    expect(added.saved).toBe(true)
    expect(await getWishlistCount()).toBe(1)
    expect((await getWishlistProductIds()).has(product.id)).toBe(true)

    const view = await getWishlistView()
    expect(view.isGuest).toBe(true)
    expect(view.items).toHaveLength(1)
    expect(view.items[0]!.productName).toBe('Test Sofa')
    expect(view.items[0]!.available).toBe(true)

    const removed = await toggleWishlistProduct(product.id)
    expect(removed.saved).toBe(false)
    expect(await getWishlistCount()).toBe(0)

    await addWishlistProduct(product.id)
    await removeWishlistProduct(product.id)
    expect(await getWishlistCount()).toBe(0)
  })

  it('moves a saved product to the cart', async () => {
    const { product } = await createFixture()
    await addWishlistProduct(product.id)
    const view = await getWishlistView()
    const itemId = view.items[0]!.id

    const result = await moveWishlistItemToCart(itemId)
    expect(result.message).toMatch(/added to your cart/i)
    expect(await getCartCount()).toBe(1)

    await removeWishlistItem(itemId)
    expect(await getWishlistCount()).toBe(0)
  })
})

describe('guest data merges into an account', () => {
  it('moves the guest cart and wishlist to the customer', async () => {
    const { variant, product } = await createFixture()
    await addCartItem(variant.id, 2)
    await addWishlistProduct(product.id)

    const user = await createCustomerUser()
    await mergeGuestCartIntoUser(user.id)
    await mergeGuestWishlistIntoUser(user.id)

    const userCart = await prisma.cart.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { items: true },
    })
    expect(userCart?.items).toHaveLength(1)
    expect(userCart?.items[0]?.quantity).toBe(2)

    const guestCart = await prisma.cart.findFirst({
      where: { guestTokenHash: { not: null } },
    })
    expect(guestCart?.status).toBe('MERGED')

    const userWishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: { items: true },
    })
    expect(userWishlist?.items).toHaveLength(1)
    expect(await prisma.wishlist.count({ where: { guestTokenHash: { not: null } } })).toBe(0)
  })

  it('merges into an existing user cart without exceeding stock', async () => {
    const { variant } = await createFixture(3)
    const user = await createCustomerUser()

    await prisma.cart.create({
      data: {
        userId: user.id,
        status: 'ACTIVE',
        items: { create: { variantId: variant.id, quantity: 2 } },
      },
    })
    await addCartItem(variant.id, 2)

    await mergeGuestCartIntoUser(user.id)

    const userCart = await prisma.cart.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { items: true },
    })
    expect(userCart?.items[0]?.quantity).toBe(3)
  })
})

describe('contact form', () => {
  function contactForm(overrides: Record<string, string> = {}): FormData {
    const form = new FormData()
    form.set('name', 'Asha Rao')
    form.set('email', 'asha@example.com')
    form.set('category', 'PRODUCT')
    form.set('subject', 'Question about a sofa')
    form.set('description', 'Can you confirm the dimensions and fabric options for this sofa?')
    for (const [key, value] of Object.entries(overrides)) form.set(key, value)
    return form
  }

  it('creates a support ticket and an opening message', async () => {
    const state = await submitContactMessage({ status: 'idle' }, contactForm())

    expect(state.status).toBe('success')
    expect(state.ticketNumber).toMatch(/^CC-\d{6}-[0-9A-F]{6}$/)

    const ticket = await prisma.supportTicket.findUnique({
      where: { ticketNumber: state.ticketNumber! },
      include: { messages: true },
    })
    expect(ticket?.email).toBe('asha@example.com')
    expect(ticket?.status).toBe('OPEN')
    expect(ticket?.messages).toHaveLength(1)
    expect(ticket?.messages[0]?.body).toContain('dimensions')
  })

  it('rejects invalid input and returns field errors', async () => {
    const form = contactForm({ email: 'not-an-email', description: 'short' })
    const state = await submitContactMessage({ status: 'idle' }, form)

    expect(state.status).toBe('error')
    expect(state.fieldErrors?.email).toBeDefined()
    expect(state.fieldErrors?.description).toBeDefined()
    expect(await prisma.supportTicket.count()).toBe(0)
  })

  it('silently discards honeypot submissions', async () => {
    const state = await submitContactMessage({ status: 'idle' }, contactForm({ company: 'spam' }))

    expect(state.status).toBe('success')
    expect(await prisma.supportTicket.count()).toBe(0)
  })
})
