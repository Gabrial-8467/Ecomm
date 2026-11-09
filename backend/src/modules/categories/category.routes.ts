import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/categories', CategoryController.getCategories);
router.get('/brands', CategoryController.getBrands);

router.post(
  '/categories',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER]),
  CategoryController.createCategory
);

router.post(
  '/brands',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER]),
  CategoryController.createBrand
);

export default router;
