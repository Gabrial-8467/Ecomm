import { prisma } from '../../config/database.js';
import { CreateAddressInput, UpdateAddressInput } from './address.types.js';

export class AddressRepository {
  async findByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string) {
    return prisma.address.findUnique({
      where: { id },
    });
  }

  async create(userId: string, data: CreateAddressInput) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          ...data,
          userId,
        },
      });
    });
  }

  async update(id: string, userId: string, data: UpdateAddressInput) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data,
      });
    });
  }

  async delete(id: string) {
    return prisma.address.delete({
      where: { id },
    });
  }
}
