import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new CustomerController();

router.use(requireAuth, requireRole('ADMIN', 'STAFF'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);

export const customerRoutes = router;
