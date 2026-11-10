import { Router } from 'express';
import { CouponController } from './coupon.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new CouponController();

// Public validate
router.post('/validate', controller.validate);

// Admin routes
router.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getAll);
router.post('/', requireAuth, requireRole('ADMIN'), controller.create);
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.delete);

export const couponRoutes = router;
