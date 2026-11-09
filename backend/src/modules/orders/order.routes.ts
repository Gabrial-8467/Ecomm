import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.post('/summary', optionalAuthenticate, OrderController.checkoutSummary);
router.post('/create', optionalAuthenticate, OrderController.createOrder);
router.post('/verify-payment', optionalAuthenticate, OrderController.verifyPayment);

router.get('/', authenticate, OrderController.getOrders);
router.put(
  '/:id/status',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER]),
  OrderController.updateStatus
);

export default router;
