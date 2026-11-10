import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { validate } from '../../middleware/validate.js';
import { addToCartSchema, updateCartItemSchema } from './cart.validation.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
const controller = new CartController();

// All cart operations require customer authentication
router.use(requireAuth);

router.get('/', controller.getCart);
router.post('/items', validate({ body: addToCartSchema }), controller.addItem);
router.put('/items/:id', validate({ body: updateCartItemSchema }), controller.updateItem);
router.delete('/items/:id', controller.removeItem);
router.delete('/', controller.clearCart);

export const cartRoutes = router;
