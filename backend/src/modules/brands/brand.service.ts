import { BrandRepository } from './brand.repository.js';
import { CreateBrandInput, UpdateBrandInput } from './brand.types.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export class BrandService {
  private brandRepo = new BrandRepository();

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getAllBrands(includeInactive = false) {
    return this.brandRepo.findAll(includeInactive);
  }

  async getBrandBySlug(slug: string) {
    const brand = await this.brandRepo.findBySlug(slug);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }
    return brand;
  }

  async createBrand(input: CreateBrandInput) {
    const slug = input.slug ? this.slugify(input.slug) : this.slugify(input.name);
    const existing = await this.brandRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictError('A brand with this slug already exists');
    }

    return this.brandRepo.create({
      ...input,
      slug,
    });
  }

  async updateBrand(id: string, input: UpdateBrandInput) {
    const brand = await this.brandRepo.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }

    if (input.slug) {
      const slug = this.slugify(input.slug);
      const existing = await this.brandRepo.findBySlug(slug);
      if (existing && existing.id !== id) {
        throw new ConflictError('Brand slug already taken');
      }
      input.slug = slug;
    }

    return this.brandRepo.update(id, input);
  }

  async deleteBrand(id: string) {
    const brand = await this.brandRepo.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }
    return this.brandRepo.delete(id);
  }
}
