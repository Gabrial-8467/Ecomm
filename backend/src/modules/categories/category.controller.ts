import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service.js';
import { DepartmentType } from '@prisma/client';

export class CategoryController {
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const department = req.query.department as DepartmentType | undefined;
      const categories = await CategoryService.getAll(department);
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await CategoryService.getBrands();
      res.status(200).json({ success: true, data: brands });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await CategoryService.createBrand(req.body);
      res.status(201).json({ success: true, data: brand });
    } catch (error) {
      next(error);
    }
  }
}
