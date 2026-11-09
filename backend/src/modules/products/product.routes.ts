import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', ProductController.list);
router.get('/:slug', ProductController.getBySlug);

router.post(
  '/',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER]),
  ProductController.create
);

export default router;
