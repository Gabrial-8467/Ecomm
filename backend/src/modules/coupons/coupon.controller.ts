import { Request, Response, NextFunction } from 'express';
import { CouponService } from './coupon.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const couponService = new CouponService();

export class CouponController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupons = await couponService.getAllCoupons();
      sendSuccess(res, coupons);
    } catch (error) {
      next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, subtotal } = req.body;
      const result = await couponService.validateCoupon(code, Number(subtotal));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.createCoupon(req.body);
      sendCreated(res, coupon, 'Coupon created successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      await couponService.deleteCoupon(id);
      sendSuccess(res, null, 'Coupon deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

