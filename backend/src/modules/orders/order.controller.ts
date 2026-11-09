import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';

export class OrderController {
  static async checkoutSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await OrderService.checkoutSummary(req.body);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.createOrder({
        ...req.body,
        userId: req.user?.id,
      });
      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.verifyRazorpayPayment(req.body);
      res.status(200).json({
        success: true,
        message: 'Payment verified and order confirmed',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER'].includes(req.user?.role || '');
      const userId = isAdmin ? undefined : req.user?.id;
      const orders = await OrderService.getOrders(userId);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await OrderService.updateOrderStatus(
        id,
        status,
        req.user?.fullName || 'Shop Staff'
      );
      res.status(200).json({ success: true, message: 'Order status updated', data: updated });
    } catch (error) {
      next(error);
    }
  }
}
