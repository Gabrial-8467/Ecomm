import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '@/lib/prisma'
import { adjustStock, listInventoryForStaff, listStockMovements } from '@/modules/inventory/inventory.service'
import {
  isOrderReturnEligible,
  requestReturnAsCustomer,
  reviewReturnRequest,
} from '@/modules/orders/return.service'
import { createCoupon, setCouponActive } from '@/modules/pricing/coupon.service'

import { createCategory, createProductFixture, createSeller } from './catalog-factories'
import { resetDatabase } from './factories'

const { cookieJar } = vi.hoisted(() => ({ cookieJar: new Map<string, string>() }))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get(name: string) {
      const value = cookieJar.get(name)
      return value ? { name, value } : undefined
    },
    set(name: string, value: string) {
      cookieJar.set(name, value)
    },
  }),
}))

describe('Phase 10 & 11 Admin Operations, Inventory & Returns', () => {
  beforeEach(async () => {
    cookieJar.clear()
    await resetDatabase()
  })

  async function createInventoryFixture() {
    const seller = await createSeller({ isPlatformOwner: true })
    const cat = await createCategory({ name: 'Furniture' })
    const prod = await createProductFixture({
      categoryId: cat.id,
      sellerId: seller.id,
      variants: [{ sku: 'TEST-SOFA-01', price: '12000.00', mrp: '15000.00', name: '3-Seater' }],
    })
    const variant = prod.variants[0]!

    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'WH-DEL-TEST',
        name: 'Delhi Test Fulfillment Hub',
        isActive: true,
      },
    })

    return { seller, cat, prod, variant, warehouse }
  }

  describe('Inventory Adjustments & Stock Movement Ledger', () => {
    it('creates initial inventory record on receipt and records movement log', async () => {
      const fixture = await createInventoryFixture()

      const result = await adjustStock({
        variantId: fixture.variant.id,
        warehouseId: fixture.warehouse.id,
        type: 'PURCHASE_RECEIPT',
        quantity: 25,
        reason: 'Initial PO goods receipt PO-9001',
        actorUserId: 'staff-user-1',
      })

      expect(result.updated.onHand).toBe(25)
      expect(result.updated.reserved).toBe(0)
      expect(result.movement.type).toBe('PURCHASE_RECEIPT')
      expect(result.movement.quantity).toBe(25)
      expect(result.movement.onHandAfter).toBe(25)

      // Query inventory list
      const staffList = await listInventoryForStaff({ warehouseId: fixture.warehouse.id })
      expect(staffList.items.length).toBe(1)
      expect(staffList.items[0]?.sellable).toBe(25)
      expect(staffList.items[0]?.isLowStock).toBe(false)

      // Query movement logs
      const movements = await listStockMovements({ variantId: fixture.variant.id })
      expect(movements.length).toBe(1)
      expect(movements[0]?.type).toBe('PURCHASE_RECEIPT')
      expect(movements[0]?.quantity).toBe(25)
    })

    it('rejects adjustment that causes on-hand to fall below reserved stock', async () => {
      const fixture = await createInventoryFixture()

      // Initial receipt of 10
      await adjustStock({
        variantId: fixture.variant.id,
        warehouseId: fixture.warehouse.id,
        type: 'PURCHASE_RECEIPT',
        quantity: 10,
        reason: 'PO-1',
        actorUserId: 'staff-1',
      })

      // Simulate 5 items reserved by active checkout
      await prisma.inventory.update({
        where: {
          variantId_warehouseId: {
            variantId: fixture.variant.id,
            warehouseId: fixture.warehouse.id,
          },
        },
        data: { reserved: 5 },
      })

      // Attempting to adjust down by -8 (which would leave 2 on-hand, less than 5 reserved)
      await expect(
        adjustStock({
          variantId: fixture.variant.id,
          warehouseId: fixture.warehouse.id,
          type: 'ADJUSTMENT',
          quantity: -8,
          reason: 'Correction',
          actorUserId: 'staff-1',
        }),
      ).rejects.toThrow(/reserved commitments/)
    })
  })

  describe('Customer Returns & Staff Inspection Review', () => {
    it('evaluates return eligibility based on 7-day delivery window', () => {
      expect(isOrderReturnEligible({ status: 'PROCESSING', deliveredAt: null }).eligible).toBe(false)
      expect(isOrderReturnEligible({ status: 'DELIVERED', deliveredAt: null }).eligible).toBe(false)

      const recentDelivery = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(isOrderReturnEligible({ status: 'DELIVERED', deliveredAt: recentDelivery }).eligible).toBe(true)

      const expiredDelivery = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      expect(isOrderReturnEligible({ status: 'DELIVERED', deliveredAt: expiredDelivery }).eligible).toBe(false)
    })

    it('creates return request, sets 48h statutory SLA, and staff review queues refund and restocks warehouse', async () => {
      const fixture = await createInventoryFixture()

      // Create a delivered order fixture
      const order = await prisma.order.create({
        data: {
          orderNumber: 'CC-261109-TEST01',
          sellerId: fixture.seller.id,
          email: 'customer@example.com',
          phone: '9876543210',
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Delivered 2 days ago
          customerSnapshot: { name: 'Customer' },
          shippingAddressSnapshot: { line1: 'Street', city: 'Delhi', pincode: '110001' },
          subtotal: '12000.00',
          grandTotal: '14160.00',
          taxTotal: '2160.00',
          items: {
            create: {
              productId: fixture.prod.id,
              variantId: fixture.variant.id,
              productName: fixture.prod.name,
              variantName: fixture.variant.name,
              sku: fixture.variant.sku,
              quantity: 1,
              unitPrice: '12000.00',
              unitMrp: '15000.00',
              taxableValue: '12000.00',
              taxRate: '18.00',
              cgst: '1080.00',
              sgst: '1080.00',
              lineTotal: '14160.00',
            },
          },
          payments: {
            create: {
              method: 'RAZORPAY',
              amount: '14160.00',
              status: 'PAID',
            },
          },
        },
        include: { items: true, payments: true },
      })

      // Grant guest order access cookie
      const { signOrderAccessToken } = await import('@/modules/orders/order-access')
      const token = await signOrderAccessToken([order.id])
      cookieJar.set('cc_order_access', token)

      // 1. Customer initiates return
      const orderItem = order.items[0]!
      const returnReq = await requestReturnAsCustomer({
        orderNumber: order.orderNumber,
        reason: 'DEFECTIVE',
        description: 'Armrest fabric torn upon arrival',
        items: [{ orderItemId: orderItem.id, quantity: 1, condition: 'OPENED' }],
      })

      expect(returnReq.status).toBe('REQUESTED')
      expect(returnReq.slaDueAt).not.toBeNull()

      // Order moved to RETURN_REQUESTED
      const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
      expect(updatedOrder.status).toBe('RETURN_REQUESTED')

      // Ensure inventory record exists for restocking
      await prisma.inventory.create({
        data: {
          variantId: fixture.variant.id,
          warehouseId: fixture.warehouse.id,
          onHand: 5,
        },
      })

      // 2. Staff inspects and approves return
      const reviewResult = await reviewReturnRequest({
        returnId: returnReq.id,
        action: 'APPROVE',
        inspectionNotes: 'Customer photo confirmed seam defect; approved for replacement/refund.',
        actorUserId: 'staff-reviewer-1',
        restockWarehouseId: fixture.warehouse.id,
      })

      expect(reviewResult.status).toBe('APPROVED')

      // Verify refund record created
      const refund = await prisma.refund.findFirstOrThrow({
        where: { returnRequestId: returnReq.id },
      })
      expect(refund.status).toBe('REQUESTED')
      expect(refund.amount.toString()).toBe('14160')

      // Verify warehouse restocked and StockMovement created
      const invAfter = await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId_warehouseId: {
            variantId: fixture.variant.id,
            warehouseId: fixture.warehouse.id,
          },
        },
      })
      expect(invAfter.onHand).toBe(6) // 5 + 1 returned
      expect(invAfter.returned).toBe(1)

      const movements = await listStockMovements({ variantId: fixture.variant.id })
      expect(movements.some((m) => m.type === 'RETURN_RECEIVED')).toBe(true)
    })
  })

  describe('Promotional Coupons Management', () => {
    it('creates, lists and toggles coupon active state', async () => {
      const coupon = await createCoupon(
        {
          code: 'FESTIVE50',
          description: 'Flat ₹50 off festive discount',
          type: 'FIXED_AMOUNT',
          value: '50.00',
          minOrderValue: '499.00',
          maxDiscount: null,
          scope: 'ORDER',
          firstOrderOnly: false,
          startsAt: null,
          endsAt: null,
          totalUsageLimit: 100,
          perCustomerLimit: 1,
          stackable: false,
          isActive: true,
        },
        'staff-admin-1',
      )

      expect(coupon.code).toBe('FESTIVE50')
      expect(coupon.isActive).toBe(true)

      // Deactivate coupon
      const updated = await setCouponActive(coupon.id, false)
      expect(updated.isActive).toBe(false)
    })
  })
})
