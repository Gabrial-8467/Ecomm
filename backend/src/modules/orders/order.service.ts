import { OrderRepository } from './order.repository.js';
import { CheckoutInput, OrderQueryFilter, UpdateOrderStatusInput } from './order.types.js';
import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError, UnprocessableEntityError } from '../../utils/errors.js';
import { generateOrderNumber } from '../../utils/order-number.js';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export class OrderService {
  private orderRepo = new OrderRepository();

  // Valid state machine transitions
  private static readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['READY_FOR_DISPATCH', 'CANCELLED'],
    READY_FOR_DISPATCH: ['OUT_FOR_DELIVERY', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['RETURN_REQUESTED'],
    RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
    CANCELLED: [],
    RETURNED: [],
  };

  async checkout(userId: string, input: CheckoutInput, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.orderRepo.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    // 1. Fetch user details and address
    const [user, address] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.address.findFirst({ where: { id: input.deliveryAddressId, userId } }),
    ]);

    if (!user) throw new NotFoundError('User not found');
    if (!address) throw new NotFoundError('Delivery address not found');

    // 2. Validate serviceable delivery zone
    const deliveryZone = await prisma.deliveryZone.findFirst({
      where: {
        isActive: true,
        pincodes: { has: address.pincode },
      },
    });

    if (!deliveryZone) {
      throw new BadRequestError(`Delivery is not available to pincode ${address.pincode}`);
    }

    // 3. Fetch cart items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Your cart is empty');
    }

    // 4. Calculate subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      if (!item.variant.isActive || item.variant.product.deletedAt) {
        throw new BadRequestError(`Item ${item.variant.product.name} (${item.variant.name}) is no longer available`);
      }
      subtotal += Number(item.variant.price) * item.quantity;
    }

    // 5. Check minimum order value for zone
    if (Number(deliveryZone.minimumOrder) > 0 && subtotal < Number(deliveryZone.minimumOrder)) {
      throw new BadRequestError(
        `Minimum order amount for ${deliveryZone.name} is ₹${deliveryZone.minimumOrder}. Current order is ₹${subtotal}.`
      );
    }

    // 6. Handle optional coupon
    let discountAmount = 0;
    let couponIdToRedeem: string | null = null;
    if (input.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: input.couponCode.toUpperCase() },
      });

      if (!coupon || !coupon.isActive) {
        throw new BadRequestError('Invalid or inactive coupon code');
      }

      const now = new Date();
      if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestError('Coupon not yet active');
      if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestError('Coupon expired');
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestError('Coupon usage limit reached');
      }
      if (Number(coupon.minimumOrder) > 0 && subtotal < Number(coupon.minimumOrder)) {
        throw new BadRequestError(`Coupon requires minimum cart subtotal of ₹${coupon.minimumOrder}`);
      }

      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
        if (coupon.maximumDiscount && discountAmount > Number(coupon.maximumDiscount)) {
          discountAmount = Number(coupon.maximumDiscount);
        }
      } else {
        discountAmount = Number(coupon.discountValue);
      }

      couponIdToRedeem = coupon.id;
    }

    const deliveryCharge = Number(deliveryZone.deliveryCharge);
    // Estimated 18% GST on furniture & electronics
    const taxAmount = Math.round(((subtotal - discountAmount) * 0.18) * 100) / 100;
    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge + taxAmount);
    const orderNumber = generateOrderNumber();

    // 7. Execute Atomic Checkout Transaction
    return prisma.$transaction(async (tx) => {
      // Step A: Conditionally reserve inventory for each item
      for (const item of cart.items) {
        const updateResult = await tx.inventory.updateMany({
          where: {
            variantId: item.variantId,
            availableQuantity: { gte: item.quantity },
          },
          data: {
            availableQuantity: { decrement: item.quantity },
            reservedQuantity: { increment: item.quantity },
          },
        });

        if (updateResult.count !== 1) {
          throw new BadRequestError(
            `Insufficient stock for "${item.variant.product.name} - ${item.variant.name}". Please update your cart.`
          );
        }
      }

      // Step B: Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: user.id,
          customerName: user.name,
          customerPhone: user.phone,
          customerEmail: user.email,
          status: 'PLACED',
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          subtotal,
          discountAmount,
          deliveryCharge,
          taxAmount,
          totalAmount,
          deliveryZoneId: deliveryZone.id,
          deliveryAddress: {
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
          customerNote: input.customerNote,
          idempotencyKey,
        },
      });

      // Step C: Create Order Items
      for (const item of cart.items) {
        const unitPrice = Number(item.variant.price);
        const totalPrice = unitPrice * item.quantity;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.variant.productId,
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantName: item.variant.name,
            sku: item.variant.sku,
            quantity: item.quantity,
            unitPrice,
            totalPrice,
          },
        });
      }

      // Step D: Record initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          newStatus: 'PLACED',
          changedBy: user.name,
          reason: 'Order placed via Cash on Delivery',
        },
      });

      // Step E: Redeem coupon if used
      if (couponIdToRedeem) {
        await tx.coupon.update({
          where: { id: couponIdToRedeem },
          data: { usedCount: { increment: 1 } },
        });

        await tx.couponRedemption.create({
          data: {
            couponId: couponIdToRedeem,
            orderId: order.id,
            customerPhone: user.phone,
          },
        });
      }

      // Step F: Empty User's Cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          statusHistory: true,
          deliveryZone: true,
        },
      });
    });
  }

  async getOrders(filters: OrderQueryFilter, customerId?: string) {
    return this.orderRepo.findMany(filters, customerId);
  }

  async getOrderByNumber(orderNumber: string, customerId?: string) {
    const order = await this.orderRepo.findByOrderNumber(orderNumber, customerId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    return order;
  }

  async cancelOrder(orderNumber: string, reason: string, cancelledByUserId: string, isCustomer = false) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (isCustomer && order.customerId !== cancelledByUserId) {
      throw new BadRequestError('You do not have permission to cancel this order');
    }

    // Customers can only cancel while order is PLACED, CONFIRMED, or PROCESSING.
    // Once READY_FOR_DISPATCH or OUT_FOR_DELIVERY, customer must contact showroom support.
    const customerCancellable: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PROCESSING'];
    const adminCancellable: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH'];
    const allowed = isCustomer ? customerCancellable : adminCancellable;

    if (!allowed.includes(order.status)) {
      if (isCustomer && (order.status === 'READY_FOR_DISPATCH' || order.status === 'OUT_FOR_DELIVERY')) {
        throw new BadRequestError(
          'This order is already packed or out with our delivery van. Please call our showroom support directly at +91 98765 43210 for immediate assistance.'
        );
      }
      throw new UnprocessableEntityError(`Order cannot be cancelled in its current status: ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      // Step A: Restore reserved stock
      for (const item of order.items) {
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: {
            reservedQuantity: { decrement: item.quantity },
            availableQuantity: { increment: item.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            type: 'RESTOCK',
            quantity: item.quantity,
            reason: `Order cancelled (${order.orderNumber}): ${reason}`,
            reference: order.id,
          },
        });
      }

      // Step B: Update order record
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });

      // Step C: Record status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: 'CANCELLED',
          changedBy: cancelledByUserId,
          reason,
        },
      });

      return updatedOrder;
    });
  }

  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput, changedByUserId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const currentStatus = order.status;
    const targetStatus = input.status;

    if (currentStatus === targetStatus) {
      return order;
    }

    // Validate state machine rules
    const allowed = OrderService.VALID_TRANSITIONS[currentStatus];
    if (!allowed.includes(targetStatus)) {
      throw new UnprocessableEntityError(
        `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed: ${allowed.join(', ') || 'None'}`
      );
    }

    // If target is CANCELLED, invoke atomic cancellation
    if (targetStatus === 'CANCELLED') {
      return this.cancelOrder(order.orderNumber, input.reason || 'Admin cancelled', changedByUserId, false);
    }

    return prisma.$transaction(async (tx) => {
      let paymentStatusUpdate: PaymentStatus | undefined;
      let deliveredAtUpdate: Date | undefined;
      let confirmedAtUpdate: Date | undefined;

      if (targetStatus === 'CONFIRMED') {
        confirmedAtUpdate = new Date();
      }

      // When order is DELIVERED, COD payment is marked PAID and reserved stock is finalized as sold
      if (targetStatus === 'DELIVERED') {
        deliveredAtUpdate = new Date();
        if (order.paymentMethod === 'COD') {
          paymentStatusUpdate = 'PAID';
        }

        for (const item of order.items) {
          await tx.inventory.update({
            where: { variantId: item.variantId },
            data: {
              reservedQuantity: { decrement: item.quantity },
            },
          });

          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              type: 'SALE',
              quantity: item.quantity,
              reason: `Order ${order.orderNumber} successfully delivered`,
              reference: order.id,
            },
          });
        }
      }

      // When order return is approved and marked RETURNED, restock inventory and refund
      if (targetStatus === 'RETURNED') {
        paymentStatusUpdate = 'REFUNDED';
        for (const item of order.items) {
          await tx.inventory.update({
            where: { variantId: item.variantId },
            data: {
              availableQuantity: { increment: item.quantity },
            },
          });

          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              type: 'RETURN',
              quantity: item.quantity,
              reason: `Order ${order.orderNumber} returned and restocked in inventory`,
              reference: order.id,
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          adminNote: input.adminNote !== undefined ? input.adminNote : order.adminNote,
          ...(paymentStatusUpdate && { paymentStatus: paymentStatusUpdate }),
          ...(deliveredAtUpdate && { deliveredAt: deliveredAtUpdate }),
          ...(confirmedAtUpdate && { confirmedAt: confirmedAtUpdate }),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: currentStatus,
          newStatus: targetStatus,
          changedBy: changedByUserId,
          reason: input.reason,
        },
      });

      return updated;
    });
  }

  async requestReturn(orderNumber: string, reason: string, customerId: string, details?: string) {
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new NotFoundError('Order not found for this customer');
    }

    if (order.status !== 'DELIVERED') {
      throw new UnprocessableEntityError('Only delivered orders can be submitted for return or replacement.');
    }

    const returnStamp = `[Return/Replacement Requested: ${reason}${details ? ` - ${details}` : ''}]`;
    const updatedNote = order.customerNote ? `${order.customerNote} | ${returnStamp}` : returnStamp;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'RETURN_REQUESTED',
          customerNote: updatedNote,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: 'DELIVERED',
          newStatus: 'RETURN_REQUESTED',
          changedBy: customerId,
          reason: `${reason}${details ? `: ${details}` : ''}`,
        },
      });

      return updated;
    });
  }
}
