import { Router } from 'express';
import { DeliveryController } from './delivery.controller.js';
import { validate } from '../../middleware/validate.js';
import { checkPincodeSchema, createDeliveryZoneSchema, updateDeliveryZoneSchema } from './delivery.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new DeliveryController();

// Public: check serviceability
router.get('/check-pincode', validate({ query: checkPincodeSchema }), controller.checkPincode);
router.get('/zones', controller.getAllZones);

// Admin: zone management
router.post('/zones', requireAuth, requireRole('ADMIN'), validate({ body: createDeliveryZoneSchema }), controller.createZone);
router.put('/zones/:id', requireAuth, requireRole('ADMIN'), validate({ body: updateDeliveryZoneSchema }), controller.updateZone);
router.delete('/zones/:id', requireAuth, requireRole('ADMIN'), controller.deleteZone);

export const deliveryRoutes = router;
