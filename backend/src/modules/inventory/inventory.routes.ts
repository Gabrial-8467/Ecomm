import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { validate } from '../../middleware/validate.js';
import { stockAdjustmentSchema, inventoryQuerySchema } from './inventory.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new InventoryController();

// Admin / Staff inventory management
router.use(requireAuth, requireRole('ADMIN', 'STAFF'));

router.get('/', validate({ query: inventoryQuerySchema }), controller.getInventory);
router.get('/movements', controller.getMovements);
router.put('/:variantId', validate({ body: stockAdjustmentSchema }), controller.adjustStock);
router.patch('/:variantId/threshold', controller.updateThreshold);

export const inventoryRoutes = router;
