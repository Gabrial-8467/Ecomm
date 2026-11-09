import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service.js';
import { DepartmentType } from '@prisma/client';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        department,
        category,
        brand,
        search,
        minPrice,
        maxPrice,
        sort,
        page,
        limit,
      } = req.query;

      const result = await ProductService.listProducts({
        department: department as DepartmentType | undefined,
        categorySlug: category as string | undefined,
        brandSlug: brand as string | undefined,
        search: search as string | undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sort as any,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getBySlug(req.params.slug);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}
