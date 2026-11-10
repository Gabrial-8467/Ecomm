import { prisma } from '../../config/database.js';
import { CreateDeliveryZoneInput, UpdateDeliveryZoneInput } from './delivery.types.js';

export class DeliveryRepository {
  async findAllZones(includeInactive = false) {
    return prisma.deliveryZone.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.deliveryZone.findUnique({
      where: { id },
    });
  }

  async findZoneByPincode(pincode: string) {
    return prisma.deliveryZone.findFirst({
      where: {
        isActive: true,
        pincodes: {
          has: pincode,
        },
      },
    });
  }

  async create(data: CreateDeliveryZoneInput) {
    return prisma.deliveryZone.create({
      data,
    });
  }

  async update(id: string, data: UpdateDeliveryZoneInput) {
    return prisma.deliveryZone.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.deliveryZone.delete({
      where: { id },
    });
  }
}
