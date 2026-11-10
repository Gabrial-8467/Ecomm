import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new ProductController();

// Public catalog routes
router.get('/', validate({ query: productQuerySchema }), controller.getAll);
router.get('/featured', controller.getFeatured);
router.get('/:slug', controller.getBySlug);

// Admin catalog routes
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: createProductSchema }), controller.create);
router.put('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: updateProductSchema }), controller.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.delete);

export const productRoutes = router;
