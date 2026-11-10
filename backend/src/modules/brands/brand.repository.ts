import { prisma } from '../../config/database.js';
import { CreateBrandInput, UpdateBrandInput } from './brand.types.js';

export class BrandRepository {
  async findAll(includeInactive = false) {
    return prisma.brand.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    return prisma.brand.findUnique({
      where: { slug },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.brand.findUnique({
      where: { id },
    });
  }

  async create(data: CreateBrandInput & { slug: string }) {
    return prisma.brand.create({ data });
  }

  async update(id: string, data: UpdateBrandInput) {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.brand.delete({
      where: { id },
    });
  }
}
