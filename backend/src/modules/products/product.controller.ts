import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const productService = new ProductService();

export class ProductController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getProducts(req.query as any);
      sendSuccess(res, result.products, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getFeatured(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getFeaturedProducts();
      sendSuccess(res, result.products);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = paramToString(req.params.slug);
      const product = await productService.getProductBySlug(slug);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      sendCreated(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const product = await productService.updateProduct(id, req.body);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      await productService.deleteProduct(id);
      sendSuccess(res, null, 'Product deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

