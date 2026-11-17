import { Router } from 'express';
import { DeliveryController } from './delivery.controller.js';
import { validate } from '../../middleware/validate.js';
import { checkPincodeSchema, createDeliveryZoneSchema, updateDeliveryZoneSchema } from './delivery.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const controller = new DeliveryController();

export const adminDeliveryRoutes = Router();

adminDeliveryRoutes.get('/zones', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getAllZones);
adminDeliveryRoutes.post('/zones', requireAuth, requireRole('ADMIN'), validate({ body: createDeliveryZoneSchema }), controller.createZone);
adminDeliveryRoutes.put('/zones/:id', requireAuth, requireRole('ADMIN'), validate({ body: updateDeliveryZoneSchema }), controller.updateZone);
adminDeliveryRoutes.delete('/zones/:id', requireAuth, requireRole('ADMIN'), controller.deleteZone);

export const storefrontDeliveryRoutes = Router();

storefrontDeliveryRoutes.get('/check-pincode', validate({ query: checkPincodeSchema }), controller.checkPincode);
