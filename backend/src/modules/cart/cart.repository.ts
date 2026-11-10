import { prisma } from '../../config/database.js';

export class CartRepository {
  async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      status: true,
                      images: { where: { isPrimary: true }, take: 1 },
                    },
                  },
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async findCartItem(cartId: string, variantId: string) {
    return prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });
  }

  async addItem(cartId: string, variantId: string, quantity: number) {
    return prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      create: { cartId, variantId, quantity },
      update: { quantity: { increment: quantity } },
    });
  }

  async updateItemQuantity(cartItemId: string, quantity: number) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  async removeItem(cartItemId: string) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  async clearCart(cartId: string) {
    return prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
