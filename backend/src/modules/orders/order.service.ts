import { OrderRepository } from './order.repository.js';
import { CheckoutInput, OrderQueryFilter, UpdateOrderStatusInput } from './order.types.js';
import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError, UnprocessableEntityError } from '../../utils/errors.js';
import { generateOrderNumber } from '../../utils/order-number.js';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { backInStockService } from '../back-in-stock/back-in-stock.service.js';
import { emailService } from '../notifications/email.service.js';

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

    const isStorePickup = input.fulfillmentType === 'STORE_PICKUP';

    // 1. Fetch user details and address
    const [user, address] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      input.deliveryAddressId
        ? prisma.address.findFirst({ where: { id: input.deliveryAddressId, userId } })
        : null,
    ]);

    if (!user) throw new NotFoundError('User not found');
    if (!isStorePickup && !input.deliveryAddressId) {
      throw new BadRequestError('Delivery address is required for home delivery');
    }
    if (!isStorePickup && !address) throw new NotFoundError('Delivery address not found');

    // 2. Validate serviceable delivery zone (if home delivery)
    let deliveryZone: any = null;
    if (!isStorePickup) {
      deliveryZone = await prisma.deliveryZone.findFirst({
        where: {
          isActive: true,
          pincodes: { has: address!.pincode },
        },
      });

      if (!deliveryZone) {
        throw new BadRequestError(`Delivery is not available to pincode ${address!.pincode}`);
      }
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

    // 5. Check minimum order value for zone (if home delivery)
    if (deliveryZone && Number(deliveryZone.minimumOrder) > 0 && subtotal < Number(deliveryZone.minimumOrder)) {
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

    const deliveryCharge = isStorePickup ? 0 : Number(deliveryZone?.deliveryCharge || 0);
    // Estimated 18% GST on furniture & electronics
    const taxAmount = Math.round(((subtotal - discountAmount) * 0.18) * 100) / 100;
    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge + taxAmount);
    const orderNumber = generateOrderNumber();

    const deliveryAddress = isStorePickup
      ? (address
          ? {
              fullName: address.fullName,
              phone: address.phone,
              addressLine1: `[Showroom Self-Pickup] ${address.addressLine1}`,
              addressLine2: address.addressLine2,
              landmark: address.landmark,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            }
          : {
              fullName: user.name,
              phone: user.phone,
              addressLine1: 'Grand Living Showroom (Self-Pickup)',
              addressLine2: 'Sector 82, JLPL Industrial Area',
              landmark: 'Near Airport Road',
              city: 'Mohali',
              state: 'Punjab',
              pincode: '160055',
            })
      : {
          fullName: address!.fullName,
          phone: address!.phone,
          addressLine1: address!.addressLine1,
          addressLine2: address!.addressLine2,
          landmark: address!.landmark,
          city: address!.city,
          state: address!.state,
          pincode: address!.pincode,
        };

    const preferredDeliveryDate = input.preferredDeliveryDate
      ? new Date(input.preferredDeliveryDate)
      : null;

    // 7. Execute Atomic Checkout Transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
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
          fulfillmentType: isStorePickup ? 'STORE_PICKUP' : 'DELIVERY',
          preferredDeliveryDate: preferredDeliveryDate && !isNaN(preferredDeliveryDate.getTime()) ? preferredDeliveryDate : null,
          deliveryTimeSlot: input.deliveryTimeSlot || null,
          requiresInstallation: Boolean(input.requiresInstallation),
          deliveryZoneId: deliveryZone?.id || null,
          deliveryAddress,
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

    if (createdOrder) {
      emailService.sendOrderConfirmation(createdOrder).catch((err) => {
        console.error('[EMAIL DISPATCH ERROR] Failed to send order confirmation:', err);
      });
    }

    return createdOrder;
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

        const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (inv && inv.availableQuantity > 0) {
          await backInStockService.notifySubscribersForVariant(item.variantId, inv.availableQuantity, tx);
        }
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
      let generatedDeliveryOtp: string | undefined;

      if (targetStatus === 'CONFIRMED') {
        confirmedAtUpdate = new Date();
      }

      // When transitioning to OUT_FOR_DELIVERY, generate 4-digit Delivery OTP if not already generated
      if (targetStatus === 'OUT_FOR_DELIVERY') {
        if (!order.deliveryOtp) {
          generatedDeliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
        }
      }

      // When order is DELIVERED, verify delivery OTP, mark COD as PAID, record POD, and finalize reserved stock
      if (targetStatus === 'DELIVERED') {
        // Verify Delivery OTP
        if (order.deliveryOtp && !input.bypassOtp) {
          if (!input.deliveryOtp || input.deliveryOtp.trim() !== order.deliveryOtp.trim()) {
            throw new BadRequestError(
              'Invalid Delivery OTP. Please enter the secure 4-digit verification code provided to the customer upon room inspection.'
            );
          }
        }

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
      let finalRefundAmount = Number(order.totalAmount);
      if (targetStatus === 'RETURNED') {
        paymentStatusUpdate = 'REFUNDED';

        if (order.isPartialReturn && Array.isArray(order.returnItems) && (order.returnItems as any[]).length > 0) {
          // Partial Return Restock: Only restock the specific items & quantities requested!
          finalRefundAmount = order.refundAmount ? Number(order.refundAmount) : 0;
          for (const retItem of order.returnItems as any[]) {
            const qtyToReturn = Number(retItem.quantity) || 1;
            await tx.inventory.update({
              where: { variantId: retItem.variantId },
              data: {
                availableQuantity: { increment: qtyToReturn },
              },
            });

            await tx.orderItem.update({
              where: { id: retItem.orderItemId },
              data: {
                returnedQuantity: { increment: qtyToReturn },
              },
            });

            await tx.inventoryMovement.create({
              data: {
                variantId: retItem.variantId,
                type: 'RETURN',
                quantity: qtyToReturn,
                reason: `Partial return approved (${order.orderNumber}): ${retItem.productName} (${retItem.variantName || 'Default'})`,
                reference: order.id,
              },
            });

            const inv = await tx.inventory.findUnique({ where: { variantId: retItem.variantId } });
            if (inv && inv.availableQuantity > 0) {
              await backInStockService.notifySubscribersForVariant(retItem.variantId, inv.availableQuantity, tx);
            }
          }
        } else {
          // Full Order Return Restock
          for (const item of order.items) {
            await tx.inventory.update({
              where: { variantId: item.variantId },
              data: {
                availableQuantity: { increment: item.quantity },
              },
            });

            await tx.orderItem.update({
              where: { id: item.id },
              data: {
                returnedQuantity: item.quantity,
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

            const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
            if (inv && inv.availableQuantity > 0) {
              await backInStockService.notifySubscribersForVariant(item.variantId, inv.availableQuantity, tx);
            }
          }
        }
      }

      // Build updated admin note if OTP was bypassed
      let finalAdminNote = input.adminNote !== undefined ? input.adminNote : order.adminNote;
      if (targetStatus === 'DELIVERED' && input.bypassOtp) {
        const bypassStamp = `[Delivery OTP Bypassed by Staff: ${input.bypassReason || 'Customer offline / phone unavailable'}]`;
        finalAdminNote = finalAdminNote ? `${finalAdminNote} | ${bypassStamp}` : bypassStamp;
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          adminNote: finalAdminNote,
          ...(input.deliveryAgentName !== undefined && { deliveryAgentName: input.deliveryAgentName }),
          ...(input.deliveryAgentPhone !== undefined && { deliveryAgentPhone: input.deliveryAgentPhone }),
          ...(paymentStatusUpdate && { paymentStatus: paymentStatusUpdate }),
          ...(deliveredAtUpdate && { deliveredAt: deliveredAtUpdate }),
          ...(confirmedAtUpdate && { confirmedAt: confirmedAtUpdate }),
          ...(generatedDeliveryOtp && { deliveryOtp: generatedDeliveryOtp }),
          ...(targetStatus === 'DELIVERED' && {
            deliveryOtpVerifiedAt: new Date(),
            ...(input.proofOfDeliveryImage && { proofOfDeliveryImage: input.proofOfDeliveryImage }),
          }),
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

      // Dispatched notification email
      if (targetStatus === 'OUT_FOR_DELIVERY') {
        const activeOtp = generatedDeliveryOtp || order.deliveryOtp;
        if (activeOtp) {
          emailService
            .sendOrderDispatched(
              {
                ...order,
                deliveryAgentName: input.deliveryAgentName || order.deliveryAgentName,
                deliveryAgentPhone: input.deliveryAgentPhone || order.deliveryAgentPhone,
              },
              activeOtp
            )
            .catch((err) => console.error('[EMAIL ERROR] Dispatch email failed:', err));
        }
      }

      // Return settled notification email
      if (targetStatus === 'RETURNED') {
        emailService
          .sendReturnSettled(order, finalRefundAmount, order.isPartialReturn)
          .catch((err) => console.error('[EMAIL ERROR] Return settled email failed:', err));
      }

      return updated;
    });
  }

  async assignDeliveryAgent(orderId: string, deliveryAgentName: string, deliveryAgentPhone: string, changedByUserId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryAgentName,
        deliveryAgentPhone,
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.status,
        newStatus: order.status,
        changedBy: changedByUserId,
        reason: `Assigned delivery agent: ${deliveryAgentName} (${deliveryAgentPhone})`,
      },
    });

    return updated;
  }

  async requestReturn(
    orderNumber: string,
    reason: string,
    customerId: string,
    details?: string,
    images: string[] = [],
    items?: { orderItemId: string; quantity: number }[]
  ) {
    const order = await this.orderRepo.findByOrderNumber(orderNumber, customerId);
    if (!order) {
      throw new NotFoundError('Order not found for this customer');
    }

    if (order.status !== 'DELIVERED') {
      throw new UnprocessableEntityError('Only delivered orders can be submitted for return or replacement.');
    }

    let isPartialReturn = false;
    let refundAmount = Number(order.totalAmount);
    let returnItemsPayload: any[] = [];

    const totalOrderQty = order.items.reduce((sum, it) => sum + it.quantity, 0);

    if (items && Array.isArray(items) && items.length > 0) {
      let totalReturnQty = 0;
      let calculatedRefund = 0;

      returnItemsPayload = items.map((retIt) => {
        const match = order.items.find((i) => i.id === retIt.orderItemId);
        if (!match) {
          throw new BadRequestError(`Invalid item selected for return: ${retIt.orderItemId}`);
        }
        const remainingQty = match.quantity - match.returnedQuantity;
        if (retIt.quantity > remainingQty) {
          throw new BadRequestError(
            `Return quantity (${retIt.quantity}) exceeds remaining delivered quantity (${remainingQty}) for ${match.productName}`
          );
        }

        totalReturnQty += retIt.quantity;
        const itemRefund = Number(match.unitPrice) * retIt.quantity;
        calculatedRefund += itemRefund;

        return {
          orderItemId: match.id,
          productId: match.productId,
          variantId: match.variantId,
          productName: match.productName,
          variantName: match.variantName,
          sku: match.sku,
          quantity: retIt.quantity,
          unitPrice: Number(match.unitPrice),
          totalRefund: itemRefund,
        };
      });

      isPartialReturn = totalReturnQty < totalOrderQty;
      refundAmount = calculatedRefund;
    } else {
      // Entire order returned
      isPartialReturn = false;
      refundAmount = Number(order.totalAmount);
      returnItemsPayload = order.items.map((i) => ({
        orderItemId: i.id,
        productId: i.productId,
        variantId: i.variantId,
        productName: i.productName,
        variantName: i.variantName,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalRefund: Number(i.totalPrice),
      }));
    }

    const returnTypeLabel = isPartialReturn ? 'Partial Return' : 'Full Return';
    const returnStamp = `[Return/Replacement Requested (${returnTypeLabel} - Est. Refund ₹${refundAmount.toLocaleString('en-IN')}): ${reason}${details ? ` - ${details}` : ''}]`;
    const updatedNote = order.customerNote ? `${order.customerNote} | ${returnStamp}` : returnStamp;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'RETURN_REQUESTED',
          customerNote: updatedNote,
          cancelReason: `${reason}${details ? ` - ${details}` : ''}`,
          returnImages: Array.isArray(images) ? images : [],
          isPartialReturn,
          refundAmount,
          returnItems: returnItemsPayload,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: 'DELIVERED',
          newStatus: 'RETURN_REQUESTED',
          changedBy: customerId,
          reason: `${returnTypeLabel}: ${reason}${details ? `: ${details}` : ''} (Est. Refund ₹${refundAmount})`,
        },
      });

      return updated;
    });
  }
}
