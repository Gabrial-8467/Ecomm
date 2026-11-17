import { Router } from 'express';
import { backInStockController } from './back-in-stock.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const backInStockRouter = Router();

// Public: Customer subscribe to back in stock
backInStockRouter.post(
  '/products/:productId/subscribe',
  (req, res, next) => backInStockController.subscribe(req, res).catch(next)
);

// Admin: Get overall waitlist summary
backInStockRouter.get(
  '/admin/waitlist',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  (req, res, next) => backInStockController.getWaitlistSummary(req, res).catch(next)
);

// Admin: Get waitlist for a specific product
backInStockRouter.get(
  '/admin/products/:productId/waitlist',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  (req, res, next) => backInStockController.getProductWaitlist(req, res).catch(next)
);

// Admin: Cancel subscription
backInStockRouter.delete(
  '/admin/subscriptions/:id',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  (req, res, next) => backInStockController.cancelSubscription(req, res).catch(next)
);

export { backInStockRouter };
