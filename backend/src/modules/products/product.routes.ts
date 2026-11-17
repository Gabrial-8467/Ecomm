import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { backInStockController } from '../back-in-stock/back-in-stock.controller.js';

const controller = new ProductController();

export const adminProductRoutes = Router();

// Staff can preview drafts and inactive products in the admin API.
adminProductRoutes.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ query: productQuerySchema }), controller.getAll);
adminProductRoutes.get('/bulk-template', requireAuth, requireRole('ADMIN', 'STAFF'), (req, res, next) => controller.getBulkTemplate(req, res, next));
adminProductRoutes.post('/bulk-import', requireAuth, requireRole('ADMIN', 'STAFF'), (req, res, next) => controller.bulkImport(req, res, next));
adminProductRoutes.get('/:slug', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getBySlug);
adminProductRoutes.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: createProductSchema }), controller.create);
adminProductRoutes.put('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate({ body: updateProductSchema }), controller.update);
adminProductRoutes.delete('/:id', requireAuth, requireRole('ADMIN'), controller.delete);

export const storefrontProductRoutes = Router();

// No optionalAuth: customer catalog can never see admin draft data.
storefrontProductRoutes.get('/', validate({ query: productQuerySchema }), controller.getAll);
storefrontProductRoutes.get('/featured', controller.getFeatured);
storefrontProductRoutes.get('/:slug', controller.getBySlug);
storefrontProductRoutes.post('/:id/back-in-stock', (req, res, next) => backInStockController.subscribe(req, res).catch(next));
