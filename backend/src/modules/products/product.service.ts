import { ProductRepository } from './product.repository.js';
import { CreateProductInput, UpdateProductInput, ProductQueryFilter } from './product.types.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export class ProductService {
  private productRepo = new ProductRepository();

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getProducts(filters: ProductQueryFilter) {
    return this.productRepo.findMany(filters);
  }

  async getProductBySlug(slugOrId: string) {
    let product = await this.productRepo.findBySlug(slugOrId);
    if (!product) {
      product = await this.productRepo.findById(slugOrId);
    }
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async getFeaturedProducts() {
    return this.productRepo.findMany({ isFeatured: true, limit: 8, status: 'ACTIVE' });
  }

  async createProduct(input: CreateProductInput) {
    const slug = input.slug ? this.slugify(input.slug) : this.slugify(input.name);
    const existing = await this.productRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictError('A product with this slug already exists');
    }

    // Ensure distinct SKUs within variants
    const skus = new Set<string>();
    for (const v of input.variants) {
      if (skus.has(v.sku)) {
        throw new ConflictError(`Duplicate SKU '${v.sku}' in variant list`);
      }
      skus.add(v.sku);
    }

    return this.productRepo.create({
      ...input,
      slug,
    });
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (input.slug) {
      const slug = this.slugify(input.slug);
      const existing = await this.productRepo.findBySlug(slug);
      if (existing && existing.id !== id) {
        throw new ConflictError('Product slug already taken');
      }
      input.slug = slug;
    }

    return this.productRepo.update(id, input);
  }

  async deleteProduct(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return this.productRepo.softDelete(id);
  }
}
