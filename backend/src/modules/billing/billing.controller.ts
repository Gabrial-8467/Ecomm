import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service.js';

export class BillingController {
  static async createPosSale(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BillingService.createPosSale({
        ...req.body,
        staffName: req.user?.fullName || 'Shop Cashier',
      });
      res.status(201).json({
        success: true,
        message: 'POS Sale generated and stock updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
