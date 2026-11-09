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

export class BillingService {
  static async createPosSale(data: {
    customerName: string;
    customerPhone: string;
    items: { variantId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    staffName: string;
    discountPercent?: number;
  }) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('No products selected for billing.', 400);
    }

    return prisma.$transaction(async (tx) => {
      let subTotal = new Prisma.Decimal(0);
      let totalGst = new Prisma.Decimal(0);
      const processedItems = [];

      // Deduct inventory atomically
      for (const item of data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true, inventory: true },
        });

        if (!variant) {
          throw new AppError(`Item variant ${item.variantId} not found`, 404);
        }

        const currentStock = variant.inventory?.availableStock || 0;
        if (currentStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${variant.product.title}" (${variant.variantName}). In stock: ${currentStock}`,
            400
          );
        }

        // Deduct inventory
        const newStock = currentStock - item.quantity;
        await tx.inventory.update({
          where: { variantId: variant.id },
          data: { availableStock: newStock },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            inventoryId: variant.inventory!.id,
            type: StockMovementType.PHYSICAL_SHOP_SALE,
            quantity: -item.quantity,
            previousStock: currentStock,
            newStock: newStock,
            performedBy: data.staffName,
            notes: `Walk-in counter sale`,
          },
        });

        const unitPrice = variant.sellingPrice;
        const itemTotal = unitPrice.mul(item.quantity);
        const gstRate = variant.product.gstRate;
        const itemGst = itemTotal.mul(gstRate).div(new Prisma.Decimal(100).add(gstRate));

        subTotal = subTotal.add(itemTotal);
        totalGst = totalGst.add(itemGst);

        processedItems.push({
          productId: variant.productId,
          variantId: variant.id,
          title: variant.product.title,
          sku: variant.sku,
          quantity: item.quantity,
          unitPrice,
          gstRate,
          gstAmount: itemGst,
          totalPrice: itemTotal,
        });
      }

      // Discount calculation
      let discountAmount = new Prisma.Decimal(0);
      if (data.discountPercent && data.discountPercent > 0) {
        discountAmount = subTotal.mul(data.discountPercent).div(100);
      }

      const totalAmount = subTotal.sub(discountAmount);
      const orderNumber = `POS-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Create POS Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          channel: OrderChannel.PHYSICAL_SHOP_COUNTER,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          subTotal,
          discountAmount,
          deliveryCharges: new Prisma.Decimal(0),
          gstTotal: totalGst,
          totalAmount,
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: data.paymentMethod,
          items: {
            create: processedItems.map((i) => ({
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
              status: OrderStatus.DELIVERED,
              remarks: `Direct shop counter sale billed by ${data.staffName}`,
              changedBy: data.staffName,
            },
          },
        },
      });

      // Create Payment Record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          paymentMethod: data.paymentMethod,
          status: PaymentStatus.PAID,
          idempotencyKey: `pos-pay-${order.orderNumber}`,
        },
      });

      // Create Tax Invoice
      const halfGst = totalGst.div(2);
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          sellerGstin: ENV.BUSINESS_GSTIN,
          sellerPan: 'AAAAA0000A',
          sellerAddress: 'Shop No. 12-14, Commercial Plaza, New Delhi',
          hsnCodeSummary: { totalItems: processedItems.length },
          cgstAmount: halfGst,
          sgstAmount: halfGst,
          igstAmount: new Prisma.Decimal(0),
          totalAmount,
        },
      });

      return {
        order,
        invoice,
        items: processedItems,
      };
    });
  }
}
