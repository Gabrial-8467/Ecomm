import { Router } from 'express';
import { BrandController } from './brand.controller.js';
import { validate } from '../../middleware/validate.js';
import { createBrandSchema, updateBrandSchema } from './brand.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const controller = new BrandController();

export const adminBrandRoutes = Router();

adminBrandRoutes.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getAll);
adminBrandRoutes.get('/:slug', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getBySlug);
adminBrandRoutes.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: createBrandSchema }), controller.create);
adminBrandRoutes.put('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: updateBrandSchema }), controller.update);
adminBrandRoutes.delete('/:id', requireAuth, requireRole('ADMIN'), controller.delete);

export const storefrontBrandRoutes = Router();

storefrontBrandRoutes.get('/', controller.getAll);
storefrontBrandRoutes.get('/:slug', controller.getBySlug);
