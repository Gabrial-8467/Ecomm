import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetCacheForTests } from '@/lib/cache'
import { prisma } from '@/lib/prisma'
import { addCartItem } from '@/modules/cart/cart.service'
import {
  getCheckoutView,
  placeOrder,
} from '@/modules/checkout/checkout.service'
import { cancelOrderAsCustomer, getOrderForViewer } from '@/modules/orders/order.service'
import { quoteShipping } from '@/modules/shipping/shipping.service'

import {
  createCategory,
  createProductFixture,
  createSeller,
} from './catalog-factories'
import { resetDatabase } from './factories'

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

async function createCheckoutFixture(stock = 10, price = '2000.00') {
  const seller = await createSeller()
  const category = await createCategory({
    name: 'Living Room Furniture',
    slug: `furniture-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  })
  const product = await createProductFixture({
    categoryId: category.id,
    sellerId: seller.id,
    status: 'ACTIVE',
    price,
    mrp: '3000.00',
  })
  const warehouse = await prisma.warehouse.create({
    data: {
      code: `WH-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'Bengaluru Test Warehouse',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      isActive: true,
      isDefault: true,
    },
  })
  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { productId: product.id },
  })
  const inventory = await prisma.inventory.create({
    data: {
      variantId: variant.id,
      warehouseId: warehouse.id,
      onHand: stock,
      reserved: 0,
      damaged: 0,
    },
  })
  const pincode = await prisma.serviceablePincode.create({
    data: {
      pincode: '560001',
      warehouseId: warehouse.id,
      city: 'Bengaluru',
      state: 'Karnataka',
      codAvailable: true,
      standardDays: 2,
      furnitureAvailable: true,
      installationAvailable: true,
      isActive: true,
    },
  })

  return { seller, category, product, variant, warehouse, inventory, pincode }
}

describe('Checkout and Order Lifecycle Integration', () => {
  beforeEach(async () => {
    cookieJar.clear()
    resetCacheForTests()
    await resetDatabase()
  })

  describe('quoteShipping', () => {
    it('returns serviceable quote for configured PIN code', async () => {
      await createCheckoutFixture()

      const quote = await quoteShipping({
        pincode: '560001',
        subtotal: 2000,
        lines: [{ quantity: 1, shippingClass: 'STANDARD' }],
      })

      expect(quote.serviceable).toBe(true)
      expect(quote.codAvailable).toBe(true)
      expect(quote.standardDays).toBe(2)
      expect(quote.city).toBe('Bengaluru')
      expect(quote.state).toBe('Karnataka')
    })

    it('returns unserviceable for unconfigured PIN code', async () => {
      const quote = await quoteShipping({
        pincode: '999999',
        subtotal: 2000,
        lines: [{ quantity: 1, shippingClass: 'STANDARD' }],
      })

      expect(quote.serviceable).toBe(false)
      expect(quote.reason).toContain('not deliver')
    })
  })

  describe('getCheckoutView', () => {
    it('returns null when cart is empty', async () => {
      const view = await getCheckoutView()
      expect(view).toBeNull()
    })

    it('calculates totals, GST and payment options for active cart', async () => {
      const fixture = await createCheckoutFixture()
      await addCartItem(fixture.variant.id, 2)

      const view = await getCheckoutView({ pincode: '560001' })
      expect(view).not.toBeNull()
      expect(view?.cart.itemCount).toBe(2)
      expect(view?.totals.subtotal).toBe(4000)
      expect(view?.quote?.serviceable).toBe(true)
      expect(view?.paymentOptions.some((p) => p.method === 'COD')).toBe(true)
    })
  })

  describe('placeOrder (Cash on Delivery)', () => {
    it('atomically reserves stock, creates order, and issues sequential tax invoice', async () => {
      const fixture = await createCheckoutFixture(5, '2000.00')
      await addCartItem(fixture.variant.id, 2)

      const success = await placeOrder({
        addressId: null,
        fullName: 'Rohan Verma',
        phone: '9876543210',
        email: 'rohan@example.com',
        line1: '12 Brigade Road',
        line2: '',
        landmark: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'IN',
        paymentMethod: 'COD',
        acceptTerms: true,
        idempotencyKey: 'idemp-cod-order-test-1',
        saveAddress: false,
        installationRequested: false,
        customerNote: '',
      })

      expect(success.orderNumber).toMatch(/^CC-\d{6}-[A-F0-9]{6}$/)
      expect(success.paymentMethod).toBe('COD')
      expect(success.requiresPayment).toBe(false)

      // Verify inventory reservation in database
      const invAfter = await prisma.inventory.findUniqueOrThrow({
        where: { id: fixture.inventory.id },
      })
      expect(invAfter.reserved).toBe(2)
      expect(invAfter.onHand - invAfter.reserved).toBe(3) // 5 - 2 = 3 sellable

      // Verify Order record
      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: success.orderNumber },
        include: { items: true, invoice: true, statusHistory: true },
      })
      expect(order.status).toBe('CONFIRMED')
      expect(order.items.length).toBe(1)
      expect(order.items[0]?.quantity).toBe(2)
      expect(order.items[0]?.sku).toBe(fixture.variant.sku)

      // Verify Sequential GST Invoice
      expect(order.invoice).not.toBeNull()
      expect(order.invoice?.invoiceNumber).toMatch(/^CC\/\d{4}-\d{2}\/\d{6}$/)
      expect(order.statusHistory.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('cancelOrderAsCustomer', () => {
    it('releases reserved stock back to inventory and moves order to CANCELLED', async () => {
      const fixture = await createCheckoutFixture(5, '2000.00')
      await addCartItem(fixture.variant.id, 3)

      const success = await placeOrder({
        addressId: null,
        fullName: 'Anita Roy',
        phone: '9876543211',
        email: 'anita@example.com',
        line1: '45 MG Road',
        line2: '',
        landmark: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'IN',
        paymentMethod: 'COD',
        acceptTerms: true,
        idempotencyKey: 'idemp-cancel-order-test-1',
        saveAddress: false,
        installationRequested: false,
        customerNote: '',
      })

      // Cancel the order
      await cancelOrderAsCustomer(success.orderNumber, 'Ordered by mistake')

      // Verify order status
      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: success.orderNumber },
      })
      expect(order.status).toBe('CANCELLED')
      expect(order.cancelledAt).not.toBeNull()

      // Verify stock reservation was released
      const invAfter = await prisma.inventory.findUniqueOrThrow({
        where: { id: fixture.inventory.id },
      })
      expect(invAfter.reserved).toBe(0)
      expect(invAfter.onHand - invAfter.reserved).toBe(5) // back to 5 available
    })
  })

  describe('getOrderForViewer Security Scoping', () => {
    it('allows guest to view own order via signed access cookie', async () => {
      const fixture = await createCheckoutFixture()
      await addCartItem(fixture.variant.id, 1)

      const success = await placeOrder({
        addressId: null,
        fullName: 'Sunil Rao',
        phone: '9876543212',
        email: 'sunil@example.com',
        line1: '78 Indiranagar',
        line2: '',
        landmark: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'IN',
        paymentMethod: 'COD',
        acceptTerms: true,
        idempotencyKey: 'idemp-guest-view-test-1',
        saveAddress: false,
        installationRequested: false,
        customerNote: '',
      })

      // Viewer lookup
      const order = await getOrderForViewer(success.orderNumber)
      expect(order.orderNumber).toBe(success.orderNumber)
    })

    it('blocks access from a browser without permission', async () => {
      const fixture = await createCheckoutFixture()
      await addCartItem(fixture.variant.id, 1)

      const success = await placeOrder({
        addressId: null,
        fullName: 'Vikram Seth',
        phone: '9876543213',
        email: 'vikram@example.com',
        line1: '90 Koramangala',
        line2: '',
        landmark: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'IN',
        paymentMethod: 'COD',
        acceptTerms: true,
        idempotencyKey: 'idemp-unauth-test-1',
        saveAddress: false,
        installationRequested: false,
        customerNote: '',
      })

      // Clear the cookies to simulate a stranger browser
      cookieJar.clear()

      await expect(getOrderForViewer(success.orderNumber)).rejects.toThrow(
        /not linked to this browser/,
      )
    })
  })
})
