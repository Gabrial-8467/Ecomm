import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service.js';
import { sendSuccess } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const cartService = new CartService();

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.getCart(req.user!.id);
      sendSuccess(res, cart);
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.addItem(req.user!.id, req.body);
      sendSuccess(res, cart, 'Item added to cart');
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const cart = await cartService.updateItemQuantity(req.user!.id, id, req.body);
      sendSuccess(res, cart, 'Cart updated');
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const cart = await cartService.removeItem(req.user!.id, id);
      sendSuccess(res, cart, 'Item removed from cart');
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.clearCart(req.user!.id);
      sendSuccess(res, cart, 'Cart cleared');
    } catch (error) {
      next(error);
    }
  }
}

