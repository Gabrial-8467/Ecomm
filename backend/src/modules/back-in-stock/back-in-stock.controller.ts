import { Request, Response } from 'express';
import { backInStockService } from './back-in-stock.service.js';
import { subscribeBackInStockSchema } from './back-in-stock.validation.js';

export class BackInStockController {
  /**
   * Public / Customer: Subscribe to restock alerts
   */
  async subscribe(req: Request, res: Response) {
    const rawProductId = req.params.productId || req.params.id;
    const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;
    const validated = subscribeBackInStockSchema.parse(req.body);

    const result = await backInStockService.subscribe(productId, validated);
    res.status(200).json({
      success: true,
      ...result,
    });
  }

  /**
   * Admin: Get aggregated waitlist summary
   */
  async getWaitlistSummary(_req: Request, res: Response) {
    const summary = await backInStockService.getWaitlistSummary();
    res.status(200).json({
      success: true,
      data: summary,
    });
  }

  /**
   * Admin: Get subscribers for a product
   */
  async getProductWaitlist(req: Request, res: Response) {
    const rawProductId = req.params.productId || req.params.id;
    const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;
    const subscriptions = await backInStockService.getProductWaitlist(productId);
    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  }

  /**
   * Admin or User: Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const updated = await backInStockService.cancelSubscription(id);
    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: updated,
    });
  }
}

export const backInStockController = new BackInStockController();
