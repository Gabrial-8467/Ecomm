import { Router } from 'express';
import { setClientApp } from '../middleware/client-app.js';
import { adminApiLimiter } from '../middleware/rate-limiter.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { adminAuthRoutes } from '../modules/auth/auth.routes.js';
import { adminCategoryRoutes } from '../modules/categories/category.routes.js';
import { adminBrandRoutes } from '../modules/brands/brand.routes.js';
import { adminProductRoutes } from '../modules/products/product.routes.js';
import { adminOrderRoutes } from '../modules/orders/order.routes.js';
import { adminCouponRoutes } from '../modules/coupons/coupon.routes.js';
import { adminDeliveryRoutes } from '../modules/delivery/delivery.routes.js';
import { adminReviewRoutes } from '../modules/reviews/review.routes.js';
import { adminBannerRoutes } from '../modules/banners/banner.routes.js';
import { adminUploadRouter } from '../modules/upload/upload.routes.js';
import { inventoryRoutes } from '../modules/inventory/inventory.routes.js';
import { customerRoutes } from '../modules/customers/customer.routes.js';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { backInStockController } from '../modules/back-in-stock/back-in-stock.controller.js';

const adminRouter = Router();

adminRouter.use(setClientApp('admin'));
adminRouter.use(adminApiLimiter);

adminRouter.use('/auth', adminAuthRoutes);
adminRouter.use('/categories', adminCategoryRoutes);
adminRouter.use('/brands', adminBrandRoutes);
adminRouter.use('/products', adminProductRoutes);
adminRouter.use('/orders', adminOrderRoutes);
adminRouter.use('/coupons', adminCouponRoutes);
adminRouter.use('/delivery', adminDeliveryRoutes);
adminRouter.use('/reviews', adminReviewRoutes);
adminRouter.use('/banners', adminBannerRoutes);
adminRouter.use('/upload', adminUploadRouter);
adminRouter.use('/inventory', inventoryRoutes);
adminRouter.use('/customers', customerRoutes);
adminRouter.use('/dashboard', dashboardRoutes);

// Back-in-stock admin endpoints (customer subscription lives in the storefront API).
const backInStockRouter = Router();
backInStockRouter.use(requireAuth, requireRole('ADMIN', 'STAFF'));
backInStockRouter.get('/waitlist', (req, res, next) => backInStockController.getWaitlistSummary(req, res).catch(next));
backInStockRouter.get('/products/:productId/waitlist', (req, res, next) => backInStockController.getProductWaitlist(req, res).catch(next));
backInStockRouter.delete('/subscriptions/:id', (req, res, next) => backInStockController.cancelSubscription(req, res).catch(next));
adminRouter.use('/back-in-stock', backInStockRouter);

export { adminRouter };
