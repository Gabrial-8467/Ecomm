import { CartRepository } from './cart.repository.js';
import { AddToCartInput, UpdateCartItemInput } from './cart.types.js';
import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export class CartService {
  private cartRepo = new CartRepository();

  async getCart(userId: string) {
    const cart = await this.cartRepo.getOrCreateCart(userId);

    let subtotal = 0;
    const enrichedItems = cart.items.map((item) => {
      const price = Number(item.variant.price);
      const total = price * item.quantity;
      const isAvailable = (item.variant.inventory?.availableQuantity || 0) >= item.quantity;

      subtotal += total;

      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: total,
        isAvailable,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          slug: item.variant.product.slug,
          variantName: item.variant.name,
          sku: item.variant.sku,
          image: item.variant.product.images[0]?.url,
        },
        inventory: {
          available: item.variant.inventory?.availableQuantity || 0,
        },
      };
    });

    return {
      id: cart.id,
      items: enrichedItems,
      subtotal,
      itemCount: enrichedItems.reduce((acc, curr) => acc + curr.quantity, 0),
    };
  }

  async addItem(userId: string, input: AddToCartInput) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.variantId },
      include: { inventory: true, product: true },
    });

    if (!variant || !variant.isActive || variant.product.deletedAt) {
      throw new NotFoundError('Product variant not available');
    }

    const available = variant.inventory?.availableQuantity || 0;
    if (available < input.quantity) {
      throw new BadRequestError(`Only ${available} items available in stock`);
    }

    const cart = await this.cartRepo.getOrCreateCart(userId);
    const existingItem = await this.cartRepo.findCartItem(cart.id, input.variantId);

    if (existingItem) {
      const newTotalQuantity = existingItem.quantity + input.quantity;
      if (newTotalQuantity > available) {
        throw new BadRequestError(`Cannot add more than ${available} items to cart`);
      }
    }

    await this.cartRepo.addItem(cart.id, input.variantId, input.quantity);
    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, cartItemId: string, input: UpdateCartItemInput) {
    const cart = await this.cartRepo.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === cartItemId);

    if (!item) {
      throw new NotFoundError('Cart item not found');
    }

    const available = item.variant.inventory?.availableQuantity || 0;
    if (input.quantity > available) {
      throw new BadRequestError(`Only ${available} items in stock`);
    }

    await this.cartRepo.updateItemQuantity(cartItemId, input.quantity);
    return this.getCart(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const cart = await this.cartRepo.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === cartItemId);

    if (!item) {
      throw new NotFoundError('Cart item not found');
    }

    await this.cartRepo.removeItem(cartItemId);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepo.getOrCreateCart(userId);
    await this.cartRepo.clearCart(cart.id);
    return this.getCart(userId);
  }
}
