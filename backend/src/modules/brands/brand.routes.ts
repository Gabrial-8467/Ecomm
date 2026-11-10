import { Router } from 'express';
import { BrandController } from './brand.controller.js';
import { validate } from '../../middleware/validate.js';
import { createBrandSchema, updateBrandSchema } from './brand.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new BrandController();

router.get('/', controller.getAll);
router.get('/:slug', controller.getBySlug);

router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: createBrandSchema }), controller.create);
router.put('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: updateBrandSchema }), controller.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.delete);

export const brandRoutes = router;
