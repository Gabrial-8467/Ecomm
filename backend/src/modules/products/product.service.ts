import { ProductRepository } from './product.repository.js';
import { CreateProductInput, UpdateProductInput, ProductQueryFilter } from './product.types.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { prisma } from '../../config/database.js';
import { backInStockService } from '../back-in-stock/back-in-stock.service.js';

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

  async bulkImport(rows: any[]) {
    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; sku?: string; error: string }[] = [];

    const categories = await prisma.category.findMany();
    const brands = await prisma.brand.findMany();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = (row.name || '').trim();
        const sku = (row.sku || '').trim().toUpperCase();
        const price = Number(row.price);

        if (!name) throw new Error('Product name is required');
        if (!sku) throw new Error('Product SKU is required');
        if (isNaN(price) || price <= 0) throw new Error('Valid price is required');

        const existingVariant = await prisma.productVariant.findUnique({
          where: { sku },
          include: { inventory: true, product: true },
        });

        if (existingVariant) {
          // Update existing variant
          const updateData: any = {
            price,
            compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
          };
          if (row.variantName) updateData.name = row.variantName;

          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: updateData,
          });

          if (row.stock !== undefined && row.stock !== null && !isNaN(Number(row.stock))) {
            const newStock = Math.max(0, Number(row.stock));
            const prevStock = existingVariant.inventory?.availableQuantity ?? 0;
            const delta = newStock - prevStock;

            if (existingVariant.inventory) {
              await prisma.inventory.update({
                where: { variantId: existingVariant.id },
                data: { availableQuantity: newStock },
              });
            } else {
              await prisma.inventory.create({
                data: {
                  variantId: existingVariant.id,
                  availableQuantity: newStock,
                },
              });
            }

            if (delta !== 0) {
              await prisma.inventoryMovement.create({
                data: {
                  variantId: existingVariant.id,
                  type: delta > 0 ? 'RESTOCK' : 'ADJUSTMENT',
                  quantity: Math.abs(delta),
                  reason: 'Bulk CSV catalog import update',
                },
              });
            }

            if (prevStock <= 0 && newStock > 0) {
              await backInStockService.notifySubscribersForVariant(existingVariant.id, newStock);
            }
          }

          updatedCount++;
        } else {
          // Create new product & variant
          const catLookup = (row.categorySlug || row.categoryName || 'living-room').toLowerCase().trim();
          let category = categories.find(
            (c) => c.slug === catLookup || c.name.toLowerCase() === catLookup
          );
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: row.categoryName || row.categorySlug || 'Living Room',
                slug: this.slugify(row.categorySlug || row.categoryName || 'living-room'),
              },
            });
            categories.push(category);
          }

          let brandId: string | null = null;
          if (row.brandSlug || row.brandName) {
            const brandLookup = (row.brandSlug || row.brandName || '').toLowerCase().trim();
            let brand = brands.find(
              (b) => b.slug === brandLookup || b.name.toLowerCase() === brandLookup
            );
            if (!brand) {
              brand = await prisma.brand.create({
                data: {
                  name: row.brandName || row.brandSlug,
                  slug: this.slugify(row.brandSlug || row.brandName),
                },
              });
              brands.push(brand);
            }
            brandId = brand.id;
          }

          let slug = this.slugify(name);
          const slugExists = await prisma.product.findUnique({ where: { slug } });
          if (slugExists) {
            slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
          }

          const stock =
            row.stock !== undefined && !isNaN(Number(row.stock)) ? Math.max(0, Number(row.stock)) : 5;

          const created = await prisma.product.create({
            data: {
              name,
              slug,
              description: row.description || `Handcrafted ${name} constructed with premium hardwood.`,
              categoryId: category.id,
              brandId,
              status: 'ACTIVE',
              variants: {
                create: {
                  name: row.variantName || 'Standard Edition',
                  sku,
                  price,
                  compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
                  inventory: {
                    create: {
                      availableQuantity: stock,
                      lowStockThreshold: 3,
                    },
                  },
                },
              },
              ...(row.imageUrl && {
                images: {
                  create: {
                    url: row.imageUrl,
                    isPrimary: true,
                    sortOrder: 0,
                  },
                },
              }),
            },
          });

          if (row.material || row.finish || row.dimensions) {
            const specs: { name: string; value: string; groupName: string }[] = [];
            if (row.material)
              specs.push({ name: 'Material', value: row.material, groupName: 'Materials & Craft' });
            if (row.finish)
              specs.push({ name: 'Finish', value: row.finish, groupName: 'Materials & Craft' });
            if (row.dimensions)
              specs.push({ name: 'Dimensions', value: row.dimensions, groupName: 'Dimensions & Weight' });

            for (const sp of specs) {
              await prisma.productSpecification.create({
                data: {
                  productId: created.id,
                  name: sp.name,
                  value: sp.value,
                  groupName: sp.groupName,
                },
              });
            }
          }

          createdCount++;
        }
      } catch (err: any) {
        errors.push({
          row: i + 1,
          sku: row.sku,
          error: err.message || 'Failed to process row',
        });
      }
    }

    return {
      message: `Processed ${rows.length} product rows: ${createdCount} created, ${updatedCount} updated${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      total: rows.length,
      createdCount,
      updatedCount,
      failedCount: errors.length,
      errors,
    };
  }

  getBulkTemplate() {
    return [
      {
        name: 'Scandinavian Solid Teak Coffee Table',
        sku: 'CT-SCAN-TEAK-01',
        variantName: 'Natural Teak Finish',
        price: 18999,
        compareAtPrice: 24999,
        categorySlug: 'tables',
        brandSlug: 'urban-living',
        stock: 12,
        description: 'Mid-century minimalist coffee table carved from seasoned CP teakwood.',
        material: 'Solid CP Teak',
        finish: 'Matte PU Coat',
        dimensions: '120cm L x 60cm W x 45cm H',
        imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Artisan Curved Fabric Armchair',
        sku: 'CHR-ART-OAT-01',
        variantName: 'Oatmeal Bouclé',
        price: 14500,
        compareAtPrice: 19000,
        categorySlug: 'chairs',
        brandSlug: 'urban-living',
        stock: 8,
        description: 'Ergonomic sculptured accent chair wrapped in stain-resistant textured bouclé.',
        material: 'Solid Ashwood Frame & High Density Foam',
        finish: 'Textured Bouclé',
        dimensions: '82cm W x 80cm D x 78cm H',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
      },
    ];
  }
}
