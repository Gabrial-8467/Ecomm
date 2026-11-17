import { Router } from 'express';
import { CouponController } from './coupon.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const controller = new CouponController();

export const adminCouponRoutes = Router();

adminCouponRoutes.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getAll);
adminCouponRoutes.post('/', requireAuth, requireRole('ADMIN'), controller.create);
adminCouponRoutes.delete('/:id', requireAuth, requireRole('ADMIN'), controller.delete);

export const storefrontCouponRoutes = Router();

storefrontCouponRoutes.post('/validate', controller.validate);
