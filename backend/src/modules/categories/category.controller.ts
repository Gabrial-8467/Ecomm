import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const categoryService = new CategoryService();

export class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = req.query.tree === 'true';
      const categories = tree
        ? await categoryService.getCategoryTree()
        : await categoryService.getAllCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = paramToString(req.params.slug);
      const category = await categoryService.getCategoryBySlug(slug);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body);
      sendCreated(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const category = await categoryService.updateCategory(id, req.body);
      sendSuccess(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      await categoryService.deleteCategory(id);
      sendSuccess(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

