import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  checkoutSchema,
  updateOrderStatusSchema,
  assignDeliveryAgentSchema,
  cancelOrderSchema,
  returnOrderSchema,
  orderQuerySchema,
} from './order.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { checkoutLimiter } from '../../middleware/rate-limiter.js';

const controller = new OrderController();

export const adminOrderRoutes = Router();

adminOrderRoutes.get('/all', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ query: orderQuerySchema }), controller.getAllOrders);
adminOrderRoutes.get('/:orderNumber', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getOrderByNumber);
adminOrderRoutes.patch('/:id/status', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: updateOrderStatusSchema }), controller.updateStatus);
adminOrderRoutes.patch('/:id/assign-agent', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: assignDeliveryAgentSchema }), controller.assignDeliveryAgent);

export const storefrontOrderRoutes = Router();

storefrontOrderRoutes.post('/', requireAuth, requireRole('CUSTOMER'), checkoutLimiter, validate({ body: checkoutSchema }), controller.checkout);
storefrontOrderRoutes.get('/', requireAuth, requireRole('CUSTOMER'), validate({ query: orderQuerySchema }), controller.getMyOrders);
storefrontOrderRoutes.get('/:orderNumber', requireAuth, requireRole('CUSTOMER'), controller.getOrderByNumber);
storefrontOrderRoutes.post('/:orderNumber/cancel', requireAuth, requireRole('CUSTOMER'), validate({ body: cancelOrderSchema }), controller.cancelOrder);
storefrontOrderRoutes.post('/:orderNumber/return', requireAuth, requireRole('CUSTOMER'), validate({ body: returnOrderSchema }), controller.requestReturn);
