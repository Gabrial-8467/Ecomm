import { prisma } from '../../config/database.js';
import { OrderQueryFilter } from './order.types.js';
import { Prisma } from '@prisma/client';

export class OrderRepository {
  async findMany(filters: OrderQueryFilter, customerId?: string) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(customerId && { customerId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
      ...(filters.customerPhone && { customerPhone: { contains: filters.customerPhone } }),
      ...(filters.orderNumber && { orderNumber: { contains: filters.orderNumber, mode: 'insensitive' } }),
      ...(filters.startDate && filters.endDate && {
        createdAt: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        },
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByOrderNumber(orderNumber: string, customerId?: string) {
    return prisma.order.findFirst({
      where: {
        orderNumber,
        ...(customerId && { customerId }),
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        deliveryZone: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        deliveryZone: true,
      },
    });
  }

  async findByIdempotencyKey(key: string) {
    return prisma.order.findUnique({
      where: { idempotencyKey: key },
      include: {
        items: true,
      },
    });
  }
}
