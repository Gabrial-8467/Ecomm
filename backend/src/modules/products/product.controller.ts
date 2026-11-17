import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';
import { NotFoundError } from '../../utils/errors.js';

const productService = new ProductService();

export class ProductController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isStaffOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';
      const filters = { ...req.query } as any;

      // Prevent draft / inactive catalog data leakage to storefront
      if (!isStaffOrAdmin) {
        filters.status = 'ACTIVE';
      }

      const result = await productService.getProducts(filters);
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
      const isStaffOrAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';
      const slug = paramToString(req.params.slug);
      const product = await productService.getProductBySlug(slug);

      // Prevent unpublished product leakage to storefront
      if (!isStaffOrAdmin && product.status !== 'ACTIVE' && product.status !== 'OUT_OF_STOCK') {
        throw new NotFoundError('Product not found');
      }

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

  async bulkImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = Array.isArray(req.body) ? req.body : req.body.items;
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'Request body must be a non-empty array of product rows' });
        return;
      }
      const result = await productService.bulkImport(items);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getBulkTemplate(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = productService.getBulkTemplate();
      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }
}

