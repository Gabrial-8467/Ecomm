import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { SubscribeBackInStockInput, WaitlistSummaryItem } from './back-in-stock.types.js';
import { Prisma } from '@prisma/client';

export class BackInStockService {
  /**
   * Customer subscribes to an out-of-stock product / variant
   */
  async subscribe(productId: string, input: SubscribeBackInStockInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isActive: true },
          include: { inventory: true },
        },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundError('Product not found or is no longer available');
    }

    const cleanVariantId = input.variantId?.trim() || null;
    let targetVariant = cleanVariantId
      ? product.variants.find((v) => v.id === cleanVariantId)
      : product.variants[0];

    // If specific variant was requested but not found
    if (cleanVariantId && !targetVariant) {
      throw new NotFoundError('Selected product variant not found');
    }

    // Check if variant currently has stock available
    const availableStock = targetVariant?.inventory?.availableQuantity ?? 0;
    if (availableStock > 0) {
      return {
        alreadyInStock: true,
        message: `Good news! ${product.name} is currently in stock (${availableStock} units available) and ready for immediate dispatch.`,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
        },
      };
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone?.trim() || null;

    // Check if already subscribed with PENDING status
    const existing = await prisma.backInStockSubscription.findFirst({
      where: {
        productId,
        variantId: targetVariant?.id || null,
        email: cleanEmail,
        status: 'PENDING',
      },
    });

    if (existing) {
      return {
        alreadySubscribed: true,
        message: "You're already on the priority restock waitlist! We'll alert you the moment workshop inventory is replenished.",
        subscription: existing,
      };
    }

    // Create new subscription
    const subscription = await prisma.backInStockSubscription.create({
      data: {
        productId,
        variantId: targetVariant?.id || null,
        email: cleanEmail,
        phone: cleanPhone,
        status: 'PENDING',
      },
      include: {
        product: { select: { name: true, slug: true } },
        variant: { select: { name: true, sku: true, price: true } },
      },
    });

    console.log(
      `[BACK-IN-STOCK WAITLIST] Registered subscriber ${cleanEmail} for "${product.name}" (${targetVariant?.name || 'Default Variant'}, SKU: ${targetVariant?.sku || 'N/A'})`
    );

    return {
      alreadySubscribed: false,
      message: 'You have been added to the priority waitlist! We will notify you immediately once workshop inventory arrives.',
      subscription,
    };
  }

  /**
   * Automatic trigger when warehouse inventory is replenished
   */
  async notifySubscribersForVariant(
    variantId: string,
    newAvailableQuantity: number,
    txClient?: Prisma.TransactionClient
  ) {
    if (newAvailableQuantity <= 0) {
      return { notifiedCount: 0, subscribers: [] };
    }

    const db = txClient || prisma;

    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!variant) return { notifiedCount: 0, subscribers: [] };

    // Find all pending subscriptions for this variant OR product-level waitlists
    const pendingSubs = await db.backInStockSubscription.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { variantId },
          { variantId: null, productId: variant.productId },
        ],
      },
    });

    if (pendingSubs.length === 0) {
      return { notifiedCount: 0, subscribers: [] };
    }

    const now = new Date();
    const subIds = pendingSubs.map((s) => s.id);

    await db.backInStockSubscription.updateMany({
      where: { id: { in: subIds } },
      data: {
        status: 'NOTIFIED',
        notifiedAt: now,
      },
    });

    // Simulated email & SMS dispatch log
    for (const sub of pendingSubs) {
      console.log(
        `[RESTOCK ALERT DISPATCH] Sent back-in-stock notification to ${sub.email} (${sub.phone || 'no phone'}): ` +
        `"${variant.product.name} - ${variant.name}" is now back in stock with ${newAvailableQuantity} units!`
      );
    }

    return {
      notifiedCount: pendingSubs.length,
      productName: variant.product.name,
      variantName: variant.name,
      subscribers: pendingSubs.map((s) => ({
        id: s.id,
        email: s.email,
        phone: s.phone,
      })),
    };
  }

  /**
   * Admin: List all products & variants that have active waitlists
   */
  async getWaitlistSummary(): Promise<WaitlistSummaryItem[]> {
    const subscriptions = await prisma.backInStockSubscription.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
            inventory: { select: { availableQuantity: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by productId + variantId
    const groups = new Map<string, WaitlistSummaryItem>();

    for (const sub of subscriptions) {
      const key = `${sub.productId}_${sub.variantId || 'all'}`;
      if (!groups.has(key)) {
        groups.set(key, {
          productId: sub.productId,
          productName: sub.product.name,
          productSlug: sub.product.slug,
          primaryImage: sub.product.images[0]?.url || null,
          variantId: sub.variantId,
          variantName: sub.variant?.name || null,
          sku: sub.variant?.sku || null,
          availableStock: sub.variant?.inventory?.availableQuantity ?? 0,
          pendingCount: 0,
          notifiedCount: 0,
          latestSubscribedAt: sub.createdAt,
          subscribers: [],
        });
      }

      const item = groups.get(key)!;
      if (sub.status === 'PENDING') {
        item.pendingCount += 1;
      } else if (sub.status === 'NOTIFIED') {
        item.notifiedCount += 1;
      }

      item.subscribers.push({
        id: sub.id,
        email: sub.email,
        phone: sub.phone,
        status: sub.status,
        createdAt: sub.createdAt,
        notifiedAt: sub.notifiedAt,
      });
    }

    return Array.from(groups.values()).sort((a, b) => b.pendingCount - a.pendingCount);
  }

  /**
   * Admin: Get all subscribers for a specific product
   */
  async getProductWaitlist(productId: string) {
    return prisma.backInStockSubscription.findMany({
      where: { productId },
      include: {
        variant: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancel or remove subscription
   */
  async cancelSubscription(id: string) {
    const sub = await prisma.backInStockSubscription.findUnique({
      where: { id },
    });
    if (!sub) {
      throw new NotFoundError('Waitlist subscription not found');
    }
    return prisma.backInStockSubscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}

export const backInStockService = new BackInStockService();
