import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { optionalAuthenticate } from '../../middleware/auth.js';

const router = Router();

router.use(optionalAuthenticate);

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.put('/items/:id', CartController.updateQuantity);
router.delete('/items/:id', CartController.removeItem);

export default router;
