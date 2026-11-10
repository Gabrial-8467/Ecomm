import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { categoryRoutes } from '../modules/categories/category.routes.js';
import { brandRoutes } from '../modules/brands/brand.routes.js';
import { productRoutes } from '../modules/products/product.routes.js';
import { inventoryRoutes } from '../modules/inventory/inventory.routes.js';
import { cartRoutes } from '../modules/cart/cart.routes.js';
import { addressRoutes } from '../modules/addresses/address.routes.js';
import { deliveryRoutes } from '../modules/delivery/delivery.routes.js';
import { orderRoutes } from '../modules/orders/order.routes.js';
import { couponRoutes } from '../modules/coupons/coupon.routes.js';
import { customerRoutes } from '../modules/customers/customer.routes.js';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { uploadRouter } from '../modules/upload/upload.routes.js';
import { reviewRoutes } from '../modules/reviews/review.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/brands', brandRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/addresses', addressRoutes);
apiRouter.use('/delivery', deliveryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/admin/dashboard', dashboardRoutes);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/reviews', reviewRoutes);

export { apiRouter };
