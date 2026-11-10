import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './category.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new CategoryController();

// Public routes
router.get('/', controller.getAll);
router.get('/:slug', controller.getBySlug);

// Admin routes
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: createCategorySchema }), controller.create);
router.put('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: updateCategorySchema }), controller.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.delete);

export const categoryRoutes = router;
