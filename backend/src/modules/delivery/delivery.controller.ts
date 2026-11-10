import { Request, Response, NextFunction } from 'express';
import { DeliveryService } from './delivery.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const deliveryService = new DeliveryService();

export class DeliveryController {
  async checkPincode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pincode } = req.query as { pincode: string };
      const result = await deliveryService.validatePincode(pincode);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAllZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const zones = await deliveryService.getAllZones(includeInactive);
      sendSuccess(res, zones);
    } catch (error) {
      next(error);
    }
  }

  async createZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zone = await deliveryService.createZone(req.body);
      sendCreated(res, zone, 'Delivery zone created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const zone = await deliveryService.updateZone(id, req.body);
      sendSuccess(res, zone, 'Delivery zone updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      await deliveryService.deleteZone(id);
      sendSuccess(res, null, 'Delivery zone deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

