import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const orderService = new OrderService();

export class OrderController {
  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const order = await orderService.checkout(req.user!.id, req.body, idempotencyKey);
      sendCreated(res, order, 'Order placed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await orderService.getOrders(req.query as any, req.user!.id);
      sendSuccess(res, result.orders, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getOrderByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isStaffOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';
      const customerId = isStaffOrAdmin ? undefined : req.user!.id;
      const orderNumber = paramToString(req.params.orderNumber);
      const order = await orderService.getOrderByNumber(orderNumber, customerId);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isStaffOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';
      const orderNumber = paramToString(req.params.orderNumber);
      const order = await orderService.cancelOrder(
        orderNumber,
        req.body.reason,
        req.user!.id,
        !isStaffOrAdmin
      );
      sendSuccess(res, order, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await orderService.getOrders(req.query as any);
      sendSuccess(res, result.orders, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const order = await orderService.updateOrderStatus(id, req.body, req.user!.id);
      sendSuccess(res, order, 'Order status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

