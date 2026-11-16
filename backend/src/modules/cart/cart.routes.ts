import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { validate } from '../../middleware/validate.js';
import { addToCartSchema, updateCartItemSchema, mergeCartSchema } from './cart.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new CartController();

// All cart operations require customer authentication (strictly isolated from admin/staff)
router.use(requireAuth, requireRole('CUSTOMER'));

router.get('/', controller.getCart);
router.post('/items', validate({ body: addToCartSchema }), controller.addItem);
router.post('/merge', validate({ body: mergeCartSchema }), controller.mergeCart);
router.put('/items/:id', validate({ body: updateCartItemSchema }), controller.updateItem);
router.delete('/items/:id', controller.removeItem);
router.delete('/', controller.clearCart);

export const cartRoutes = router;
