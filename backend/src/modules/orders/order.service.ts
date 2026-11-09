import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  OrderChannel,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  StockMovementType,
} from '@prisma/client';

export class OrderService {
  static generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${new Date().getFullYear()}-${timestamp}${random}`;
  }

  static generateInvoiceNumber() {
    const random = Math.floor(10000 + Math.random() * 90000);
    return `INV-${new Date().getFullYear()}-${random}`;
  }

  static async checkoutSummary(data: {
    items: { variantId: string; quantity: number }[];
    couponCode?: string;
  }) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('No items provided for checkout.', 400);
    }

    let subTotal = new Prisma.Decimal(0);
    let totalGst = new Prisma.Decimal(0);
    const calculatedItems = [];

    for (const item of data.items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          product: true,
          inventory: true,
        },
      });

      if (!variant || !variant.isActive) {
        throw new AppError(`Item variant ${item.variantId} is no longer available.`, 400);
      }

      if ((variant.inventory?.availableStock || 0) < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${variant.product.title}". Available: ${variant.inventory?.availableStock || 0}`,
          400
        );
      }

      const unitPrice = variant.sellingPrice;
      const quantity = item.quantity;
      const itemTotal = unitPrice.mul(quantity);
      const gstRate = variant.product.gstRate;
      // GST calculation: itemTotal - (itemTotal / (1 + (gstRate/100)))
      const itemGst = itemTotal.mul(gstRate).div(new Prisma.Decimal(100).add(gstRate));

      subTotal = subTotal.add(itemTotal);
      totalGst = totalGst.add(itemGst);

      calculatedItems.push({
        variantId: variant.id,
        productId: variant.productId,
        title: variant.product.title,
        sku: variant.sku,
        quantity,
        unitPrice,
        gstRate,
        gstAmount: itemGst,
        totalPrice: itemTotal,
      });
    }

    // Coupon discount logic
    let discountAmount = new Prisma.Decimal(0);
    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive && new Date() <= coupon.validUntil) {
        if (!coupon.minOrderAmount || subTotal.gte(coupon.minOrderAmount)) {
          if (coupon.discountType === 'PERCENTAGE') {
            const rawDiscount = subTotal.mul(coupon.discountValue).div(100);
            discountAmount = coupon.maxDiscount
              ? Prisma.Decimal.min(rawDiscount, coupon.maxDiscount)
              : rawDiscount;
          } else {
            discountAmount = coupon.discountValue;
          }
        }
      }
    }

    // Indian Delivery fee policy: Free over Rs 2000, else flat Rs 150
    const deliveryFee = subTotal.gte(2000) ? new Prisma.Decimal(0) : new Prisma.Decimal(150);
    const finalTotal = subTotal.sub(discountAmount).add(deliveryFee);

    return {
      items: calculatedItems,
      subTotal,
      discountAmount,
      deliveryCharges: deliveryFee,
      gstTotal: totalGst,
      totalAmount: finalTotal,
    };
  }

  static async createOrder(data: {
    userId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: {
      recipientName: string;
      phoneNumber: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
    items: { variantId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    couponCode?: string;
  }) {
    const summary = await this.checkoutSummary({
      items: data.items,
      couponCode: data.couponCode,
    });

    return prisma.$transaction(async (tx) => {
      // 1. Create Address
      let shippingAddressId: string | undefined;
      if (data.userId) {
        const address = await tx.address.create({
          data: {
            userId: data.userId,
            recipientName: data.shippingAddress.recipientName,
            phoneNumber: data.shippingAddress.phoneNumber,
            addressLine1: data.shippingAddress.addressLine1,
            addressLine2: data.shippingAddress.addressLine2,
            city: data.shippingAddress.city,
            state: data.shippingAddress.state,
            postalCode: data.shippingAddress.postalCode,
          },
        });
        shippingAddressId = address.id;
      }

      // 2. Atomically reserve inventory and record stock movements
      for (const item of summary.items) {
        const inv = await tx.inventory.findUnique({
          where: { variantId: item.variantId },
        });

        if (!inv || inv.availableStock < item.quantity) {
          throw new AppError(`Item "${item.title}" just sold out. Please update cart.`, 400);
        }

        const newStock = inv.availableStock - item.quantity;
        await tx.inventory.update({
          where: { id: inv.id },
          data: { availableStock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            inventoryId: inv.id,
            type: StockMovementType.ONLINE_SALE,
            quantity: -item.quantity,
            previousStock: inv.availableStock,
            newStock: newStock,
            performedBy: 'Online Customer Checkout',
            notes: `Reserved for online order`,
          },
        });
      }

      // 3. Create Order
      const orderNumber = this.generateOrderNumber();
      const isCod = data.paymentMethod === PaymentMethod.CASH_ON_DELIVERY;

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: data.userId || null,
          channel: OrderChannel.ONLINE_WEBSITE,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          shippingAddressId: shippingAddressId || null,
          subTotal: summary.subTotal,
          discountAmount: summary.discountAmount,
          deliveryCharges: summary.deliveryCharges,
          gstTotal: summary.gstTotal,
          totalAmount: summary.totalAmount,
          couponCode: data.couponCode || null,
          status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          paymentStatus: isCod ? PaymentStatus.PENDING : PaymentStatus.PENDING,
          paymentMethod: data.paymentMethod,
          items: {
            create: summary.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              titleSnapshot: i.title,
              skuSnapshot: i.sku,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              gstRate: i.gstRate,
              gstAmount: i.gstAmount,
              totalPrice: i.totalPrice,
            })),
          },
          statusHistory: {
            create: {
              status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
              remarks: isCod ? 'COD Order Placed' : 'Order Initiated',
              changedBy: data.userId || 'SYSTEM',
            },
          },
        },
        include: {
          items: true,
        },
      });

      // 4. Generate Initial Payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          paymentMethod: data.paymentMethod,
          status: PaymentStatus.PENDING,
          idempotencyKey: `pay-${order.orderNumber}`,
        },
      });

      // 5. Generate Tax Invoice record
      const halfGst = summary.gstTotal.div(2);
      await tx.invoice.create({
        data: {
          invoiceNumber: this.generateInvoiceNumber(),
          orderId: order.id,
          sellerGstin: ENV.BUSINESS_GSTIN,
          sellerPan: 'AAAAA0000A',
          sellerAddress: 'Shop No. 12-14, Commercial Plaza, New Delhi',
          hsnCodeSummary: { itemsCount: summary.items.length },
          cgstAmount: halfGst,
          sgstAmount: halfGst,
          igstAmount: new Prisma.Decimal(0),
          totalAmount: order.totalAmount,
        },
      });

      return {
        order,
        payment,
      };
    });
  }

  static async verifyRazorpayPayment(data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const text = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // In non-configured test mode, accept matching or fallback signature
    const isValid =
      generatedSignature === data.razorpaySignature ||
      ENV.RAZORPAY_KEY_SECRET === 'placeholder_secret';

    if (!isValid) {
      throw new AppError('Payment signature verification failed. Fraud attempt logged.', 400);
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: data.orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
      });

      await tx.payment.updateMany({
        where: { orderId: data.orderId },
        data: {
          status: PaymentStatus.PAID,
          razorpayOrderId: data.razorpayOrderId,
          razorpayPaymentId: data.razorpayPaymentId,
          razorpaySignature: data.razorpaySignature,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.CONFIRMED,
          remarks: `Payment Verified (Razorpay ID: ${data.razorpayPaymentId})`,
          changedBy: 'RAZORPAY_WEBHOOK',
        },
      });

      return order;
    });
  }

  static async getOrders(userId?: string, limit = 50) {
    return prisma.order.findMany({
      where: userId ? { userId } : {},
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        invoice: true,
        shipment: true,
        payments: true,
      },
    });
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus, changedBy: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          remarks: `Status updated to ${status}`,
          changedBy,
        },
      });

      return order;
    });
  }
}
