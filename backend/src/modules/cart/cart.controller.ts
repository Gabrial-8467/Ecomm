import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service.js';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.headers['x-session-id'] as string | undefined;
      const cart = await CartService.getOrCreateCart(req.user?.id, sessionId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.headers['x-session-id'] as string | undefined;
      const { productId, variantId, quantity } = req.body;
      const cart = await CartService.addItem({
        userId: req.user?.id,
        sessionId,
        productId,
        variantId,
        quantity: Math.max(1, Number(quantity) || 1),
      });
      res.status(200).json({ success: true, message: 'Item added to cart', data: cart });
    } catch (error) {
      next(error);
    }
  }

  static async updateQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      await CartService.updateQuantity(id, Number(quantity));
      res.status(200).json({ success: true, message: 'Quantity updated' });
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await CartService.removeItem(id);
      res.status(200).json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
      next(error);
    }
  }
}
