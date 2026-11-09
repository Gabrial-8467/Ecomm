import { prisma } from '../../lib/prisma.js';
import { DepartmentType } from '@prisma/client';

export class CategoryService {
  static async getAll(department?: DepartmentType) {
    return prisma.category.findMany({
      where: {
        isActive: true,
        ...(department ? { department } : {}),
      },
      include: {
        children: {
          where: { isActive: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  static async getBrands() {
    return prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  static async createCategory(data: {
    name: string;
    slug: string;
    department: DepartmentType;
    description?: string;
    imageUrl?: string;
    parentId?: string;
  }) {
    return prisma.category.create({
      data,
    });
  }

  static async createBrand(data: {
    name: string;
    slug: string;
    logoUrl?: string;
    description?: string;
  }) {
    return prisma.brand.create({
      data,
    });
  }
}
