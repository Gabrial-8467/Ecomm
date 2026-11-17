import { Router } from 'express';
import { setClientApp } from '../middleware/client-app.js';
import { storefrontApiLimiter } from '../middleware/rate-limiter.js';
import { storefrontAuthRoutes } from '../modules/auth/auth.routes.js';
import { storefrontCategoryRoutes } from '../modules/categories/category.routes.js';
import { storefrontBrandRoutes } from '../modules/brands/brand.routes.js';
import { storefrontProductRoutes } from '../modules/products/product.routes.js';
import { storefrontOrderRoutes } from '../modules/orders/order.routes.js';
import { storefrontCouponRoutes } from '../modules/coupons/coupon.routes.js';
import { storefrontDeliveryRoutes } from '../modules/delivery/delivery.routes.js';
import { storefrontReviewRoutes } from '../modules/reviews/review.routes.js';
import { storefrontBannerRoutes } from '../modules/banners/banner.routes.js';
import { storefrontUploadRouter } from '../modules/upload/upload.routes.js';
import { cartRoutes } from '../modules/cart/cart.routes.js';
import { addressRoutes } from '../modules/addresses/address.routes.js';

const storefrontRouter = Router();

storefrontRouter.use(setClientApp('storefront'));
storefrontRouter.use(storefrontApiLimiter);

storefrontRouter.use('/auth', storefrontAuthRoutes);
storefrontRouter.use('/categories', storefrontCategoryRoutes);
storefrontRouter.use('/brands', storefrontBrandRoutes);
storefrontRouter.use('/products', storefrontProductRoutes);
storefrontRouter.use('/cart', cartRoutes);
storefrontRouter.use('/addresses', addressRoutes);
storefrontRouter.use('/delivery', storefrontDeliveryRoutes);
storefrontRouter.use('/orders', storefrontOrderRoutes);
storefrontRouter.use('/coupons', storefrontCouponRoutes);
storefrontRouter.use('/reviews', storefrontReviewRoutes);
storefrontRouter.use('/banners', storefrontBannerRoutes);
storefrontRouter.use('/upload', storefrontUploadRouter);

export { storefrontRouter };
