import { CategoryRepository } from './category.repository.js';
import { CreateCategoryInput, UpdateCategoryInput } from './category.types.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export class CategoryService {
  private categoryRepo = new CategoryRepository();

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getAllCategories(includeInactive = false) {
    return this.categoryRepo.findAll(includeInactive);
  }

  async getCategoryTree(includeInactive = false) {
    return this.categoryRepo.findRootCategories(includeInactive);
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.categoryRepo.findBySlug(slug);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async createCategory(input: CreateCategoryInput) {
    const slug = input.slug ? this.slugify(input.slug) : this.slugify(input.name);
    const existing = await this.categoryRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictError('A category with this slug already exists');
    }

    if (input.parentId) {
      const parent = await this.categoryRepo.findById(input.parentId);
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    return this.categoryRepo.create({
      ...input,
      slug,
    });
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (input.slug) {
      const slug = this.slugify(input.slug);
      const existing = await this.categoryRepo.findBySlug(slug);
      if (existing && existing.id !== id) {
        throw new ConflictError('Category slug already taken');
      }
      input.slug = slug;
    }

    return this.categoryRepo.update(id, input);
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return this.categoryRepo.delete(id);
  }
}
