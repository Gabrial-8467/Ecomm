import { Request, Response, NextFunction } from 'express';
import { BrandService } from './brand.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const brandService = new BrandService();

export class BrandController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await brandService.getAllBrands(req.query.includeInactive === 'true');
      sendSuccess(res, brands);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = paramToString(req.params.slug);
      const brand = await brandService.getBrandBySlug(slug);
      sendSuccess(res, brand);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.createBrand(req.body);
      sendCreated(res, brand, 'Brand created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const brand = await brandService.updateBrand(id, req.body);
      sendSuccess(res, brand, 'Brand updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      await brandService.deleteBrand(id);
      sendSuccess(res, null, 'Brand deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

