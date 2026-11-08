import 'server-only'

import { z } from 'zod'

import type { StockMovementType } from '@/generated/prisma/client'
import { ConflictError, NotFoundError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

export interface InventoryItemRow {
  id: string
  variantId: string
  warehouseId: string
  onHand: number
  reserved: number
  damaged: number
  returned: number
  sellable: number
  lowStockThreshold: number
  isLowStock: boolean
  updatedAt: Date
  warehouse: {
    id: string
    code: string
    name: string
  }
  variant: {
    id: string
    sku: string
    name: string
    price: string
    product: {
      id: string
      name: string
      slug: string
    }
  }
}

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: [{ isActive: 'desc' }, { isDefault: 'desc' }, { code: 'asc' }],
  })
}

export async function listInventoryForStaff(input: {
  warehouseId?: string
  lowStockOnly?: boolean
  query?: string
  take?: number
  skip?: number
} = {}): Promise<{ items: InventoryItemRow[]; total: number }> {
  const term = input.query?.trim()
  const where = {
    ...(input.warehouseId ? { warehouseId: input.warehouseId } : {}),
    ...(term
      ? {
          OR: [
            { variant: { sku: { contains: term, mode: 'insensitive' as const } } },
            { variant: { name: { contains: term, mode: 'insensitive' as const } } },
            { variant: { product: { name: { contains: term, mode: 'insensitive' as const } } } },
          ],
        }
      : {}),
  }

  const rows = await prisma.inventory.findMany({
    where,
    include: {
      warehouse: { select: { id: true, code: true, name: true } },
      variant: {
        select: {
          id: true,
          sku: true,
          name: true,
          price: true,
          product: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: [{ warehouse: { code: 'asc' } }, { variant: { sku: 'asc' } }],
    take: input.take ?? 100,
    skip: input.skip ?? 0,
  })

  const mapped: InventoryItemRow[] = rows.map((row) => {
    const sellable = Math.max(0, row.onHand - row.reserved - row.damaged)
    return {
      id: row.id,
      variantId: row.variantId,
      warehouseId: row.warehouseId,
      onHand: row.onHand,
      reserved: row.reserved,
      damaged: row.damaged,
      returned: row.returned,
      sellable,
      lowStockThreshold: row.lowStockThreshold,
      isLowStock: sellable <= row.lowStockThreshold,
      updatedAt: row.updatedAt,
      warehouse: row.warehouse,
      variant: {
        id: row.variant.id,
        sku: row.variant.sku,
        name: row.variant.name,
        price: row.variant.price.toString(),
        product: row.variant.product,
      },
    }
  })

  const filtered = input.lowStockOnly ? mapped.filter((item) => item.isLowStock) : mapped
  return { items: filtered, total: filtered.length }
}

export const stockAdjustmentSchema = z.object({
  variantId: z.string().min(1, 'Select a product variant.'),
  warehouseId: z.string().min(1, 'Select a warehouse.'),
  type: z.enum([
    'PURCHASE_RECEIPT',
    'ADJUSTMENT',
    'DAMAGE',
    'RETURN_RECEIVED',
  ] as const),
  quantity: z
    .number()
    .int('Quantity must be an integer.')
    .refine((val) => val !== 0, 'Quantity cannot be zero.'),
  reason: z.string().trim().min(3, 'Provide a reason (at least 3 characters).').max(500),
  actorUserId: z.string().min(1),
})

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>

export async function adjustStock(input: StockAdjustmentInput) {
  const validated = stockAdjustmentSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: validated.variantId },
      select: { id: true, sku: true },
    })
    if (!variant) throw new NotFoundError('Product variant not found.')

    const warehouse = await tx.warehouse.findUnique({
      where: { id: validated.warehouseId },
      select: { id: true, code: true },
    })
    if (!warehouse) throw new NotFoundError('Warehouse not found.')

    let record = await tx.inventory.findUnique({
      where: {
        variantId_warehouseId: {
          variantId: validated.variantId,
          warehouseId: validated.warehouseId,
        },
      },
    })

    if (!record) {
      record = await tx.inventory.create({
        data: {
          variantId: validated.variantId,
          warehouseId: validated.warehouseId,
          onHand: 0,
          reserved: 0,
          damaged: 0,
          returned: 0,
        },
      })
    }

    let newOnHand = record.onHand
    let newDamaged = record.damaged
    let newReturned = record.returned

    switch (validated.type) {
      case 'PURCHASE_RECEIPT': {
        if (validated.quantity < 0) {
          throw new ConflictError('Purchase receipts must have a positive quantity.')
        }
        newOnHand += validated.quantity
        break
      }
      case 'ADJUSTMENT': {
        newOnHand += validated.quantity
        break
      }
      case 'DAMAGE': {
        if (validated.quantity < 0) {
          throw new ConflictError('Damage quantity must be positive.')
        }
        newOnHand = Math.max(0, newOnHand - validated.quantity)
        newDamaged += validated.quantity
        break
      }
      case 'RETURN_RECEIVED': {
        if (validated.quantity < 0) {
          throw new ConflictError('Return quantity must be positive.')
        }
        newOnHand += validated.quantity
        newReturned += validated.quantity
        break
      }
      default:
        throw new ConflictError(`Unsupported adjustment type: ${validated.type}`)
    }

    if (newOnHand < 0) {
      throw new ConflictError(`Cannot adjust stock below zero (resulting on-hand would be ${newOnHand}).`)
    }

    if (newOnHand < record.reserved) {
      throw new ConflictError(
        `On-hand stock (${newOnHand}) cannot be reduced below reserved commitments (${record.reserved}).`,
      )
    }

    const updated = await tx.inventory.update({
      where: { id: record.id },
      data: {
        onHand: newOnHand,
        damaged: newDamaged,
        returned: newReturned,
      },
    })

    const movement = await tx.stockMovement.create({
      data: {
        variantId: validated.variantId,
        warehouseId: validated.warehouseId,
        type: validated.type as StockMovementType,
        quantity: validated.quantity,
        onHandAfter: newOnHand,
        reservedAfter: record.reserved,
        reason: validated.reason,
        actorUserId: validated.actorUserId,
      },
    })

    return { updated, movement }
  })
}

export async function listStockMovements(input: {
  variantId?: string
  warehouseId?: string
  take?: number
} = {}) {
  return prisma.stockMovement.findMany({
    where: {
      ...(input.variantId ? { variantId: input.variantId } : {}),
      ...(input.warehouseId ? { warehouseId: input.warehouseId } : {}),
    },
    include: {
      warehouse: { select: { code: true, name: true } },
      variant: {
        select: {
          sku: true,
          name: true,
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: input.take ?? 50,
  })
}
