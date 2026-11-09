import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER])
);

router.post('/pos-order', BillingController.createPosSale);

export default router;
