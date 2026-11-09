import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER]));

router.get('/', InventoryController.getLiveStock);
router.post('/adjust', InventoryController.adjustStock);
router.get('/movements', InventoryController.getMovements);

export default router;
