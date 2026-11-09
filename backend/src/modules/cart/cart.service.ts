import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export class CartService {
  static async getOrCreateCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new AppError('Either user ID or session ID is required to fetch cart.', 400);
    }

    let cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                department: true,
                hsnCode: true,
                gstRate: true,
                images: { where: { isThumbnail: true }, take: 1 },
              },
            },
            variant: {
              include: {
                inventory: { select: { availableStock: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: userId || null,
          sessionId: sessionId || null,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  department: true,
                  hsnCode: true,
                  gstRate: true,
                  images: { where: { isThumbnail: true }, take: 1 },
                },
              },
              variant: {
                include: {
                  inventory: { select: { availableStock: true } },
                },
              },
            },
          },
        },
      });
    }

    // Calculate subtotal and tax summary
    let subTotal = 0;
    let estimatedGst = 0;

    const formattedItems = cart.items.map((item) => {
      const price = Number(item.variant.sellingPrice);
      const mrp = Number(item.variant.mrp);
      const gstRate = Number(item.product.gstRate);
      const itemSubtotal = price * item.quantity;
      const itemGst = (itemSubtotal * gstRate) / (100 + gstRate); // Inclusive GST calculation

      subTotal += itemSubtotal;
      estimatedGst += itemGst;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        title: item.product.title,
        slug: item.product.slug,
        department: item.product.department,
        variantName: item.variant.variantName,
        sku: item.variant.sku,
        unitPrice: price,
        mrp: mrp,
        quantity: item.quantity,
        availableStock: item.variant.inventory?.availableStock || 0,
        imageUrl: item.variant.imageUrl || item.product.images[0]?.url,
        total: itemSubtotal,
      };
    });

    // Check delivery fee (Free delivery above Rs 2,000)
    const deliveryFee = subTotal > 0 && subTotal < 2000 ? 150 : 0;
    const finalAmount = subTotal + deliveryFee;

    return {
      cartId: cart.id,
      items: formattedItems,
      subTotal: Math.round(subTotal * 100) / 100,
      estimatedGst: Math.round(estimatedGst * 100) / 100,
      deliveryFee,
      finalAmount: Math.round(finalAmount * 100) / 100,
    };
  }

  static async addItem(data: {
    userId?: string;
    sessionId?: string;
    productId: string;
    variantId: string;
    quantity: number;
  }) {
    const cart = await this.getOrCreateCart(data.userId, data.sessionId);

    // Verify stock
    const inventory = await prisma.inventory.findUnique({
      where: { variantId: data.variantId },
    });

    if (!inventory || inventory.availableStock < data.quantity) {
      throw new AppError(
        `Insufficient stock available. Available: ${inventory?.availableStock || 0}`,
        400
      );
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.cartId,
          variantId: data.variantId,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + data.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.cartId,
          productId: data.productId,
          variantId: data.variantId,
          quantity: data.quantity,
        },
      });
    }

    return this.getOrCreateCart(data.userId, data.sessionId);
  }

  static async updateQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
    }
  }

  static async removeItem(cartItemId: string) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  }
}
