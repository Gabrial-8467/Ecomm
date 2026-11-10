import { Router } from 'express';
import { AddressController } from './address.controller.js';
import { validate } from '../../middleware/validate.js';
import { createAddressSchema, updateAddressSchema } from './address.validation.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
const controller = new AddressController();

router.use(requireAuth);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate({ body: createAddressSchema }), controller.create);
router.put('/:id', validate({ body: updateAddressSchema }), controller.update);
router.delete('/:id', controller.delete);

export const addressRoutes = router;
