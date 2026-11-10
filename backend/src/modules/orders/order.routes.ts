import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { validate } from '../../middleware/validate.js';
import { checkoutSchema, updateOrderStatusSchema, cancelOrderSchema, orderQuerySchema } from './order.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { checkoutLimiter } from '../../middleware/rate-limiter.js';

const router = Router();
const controller = new OrderController();

// Customer order routes
router.post('/', requireAuth, checkoutLimiter, validate({ body: checkoutSchema }), controller.checkout);
router.get('/', requireAuth, validate({ query: orderQuerySchema }), controller.getMyOrders);
router.get('/:orderNumber', requireAuth, controller.getOrderByNumber);
router.post('/:orderNumber/cancel', requireAuth, validate({ body: cancelOrderSchema }), controller.cancelOrder);

// Admin order routes
router.get('/admin/all', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ query: orderQuerySchema }), controller.getAllOrders);
router.patch('/admin/:id/status', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: updateOrderStatusSchema }), controller.updateStatus);

export const orderRoutes = router;
