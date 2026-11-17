import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './category.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const controller = new CategoryController();

export const adminCategoryRoutes = Router();

adminCategoryRoutes.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getAll);
adminCategoryRoutes.get('/:slug', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getBySlug);
adminCategoryRoutes.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: createCategorySchema }), controller.create);
adminCategoryRoutes.put('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: updateCategorySchema }), controller.update);
adminCategoryRoutes.delete('/:id', requireAuth, requireRole('ADMIN'), controller.delete);

export const storefrontCategoryRoutes = Router();

storefrontCategoryRoutes.get('/', controller.getAll);
storefrontCategoryRoutes.get('/:slug', controller.getBySlug);
