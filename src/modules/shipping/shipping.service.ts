import 'server-only'

import { z } from 'zod'

import type { ServiceablePincode, ShippingClass } from '@/generated/prisma/client'
import { getEnv } from '@/lib/env'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

const PINCODE_PATTERN = /^[1-9][0-9]{5}$/

export const pincodeSchema = z
  .string()
  .trim()
  .regex(PINCODE_PATTERN, 'Enter a valid 6-digit Indian PIN code.')

export const serviceablePincodeInputSchema = z.object({
  pincode: pincodeSchema,
  warehouseId: z.string().trim().optional().nullable().default(null),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(80).optional().default(''),
  codAvailable: z.boolean().default(true),
  standardDays: z.coerce.number().int().min(0).max(30).default(5),
  furnitureAvailable: z.boolean().default(false),
  installationAvailable: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type ServiceablePincodeInput = z.infer<typeof serviceablePincodeInputSchema>

export interface ShippingQuoteLine {
  quantity: number
  shippingClass: ShippingClass
}

export interface ShippingQuote {
  pincode: string
  serviceable: boolean
  reason: string | null
  shippingTotal: number
  freeShippingApplied: boolean
  codAvailable: boolean
  codFee: number
  standardDays: number | null
  estimatedDeliveryDate: string | null
  installationAvailable: boolean
  city: string | null
  state: string | null
  /** Warehouse that serves this PIN code, when configured. */
  warehouseId: string | null
}

function notServiceable(pincode: string, reason: string): ShippingQuote {
  return {
    pincode,
    serviceable: false,
    reason,
    shippingTotal: 0,
    freeShippingApplied: false,
    codAvailable: false,
    codFee: 0,
    standardDays: null,
    estimatedDeliveryDate: null,
    installationAvailable: false,
    city: null,
    state: null,
    warehouseId: null,
  }
}

function needsFurnitureHandling(lines: ShippingQuoteLine[]): boolean {
  return lines.some(
    (line) =>
      line.quantity > 0 && (line.shippingClass === 'FURNITURE' || line.shippingClass === 'HEAVY'),
  )
}

/**
 * Quote delivery for a PIN code using the serviceable-pincode table. Shipping
 * is free above `FREE_SHIPPING_THRESHOLD`; otherwise a flat configured fee
 * applies. No quote is invented when a PIN code is not configured — checkout
 * refuses to proceed instead.
 */
export async function quoteShipping(input: {
  pincode: string
  subtotal: number
  lines: ShippingQuoteLine[]
  paymentMethod?: 'RAZORPAY' | 'COD'
}): Promise<ShippingQuote> {
  const parsed = pincodeSchema.safeParse(input.pincode)
  if (!parsed.success) return notServiceable(input.pincode, 'Enter a valid 6-digit PIN code.')

  const pincode = parsed.data
  const rows = await prisma.serviceablePincode.findMany({
    where: { pincode, isActive: true },
    include: { warehouse: { select: { name: true, isActive: true } } },
  })

  const usable = rows.filter((row) => !row.warehouse || row.warehouse.isActive)
  if (usable.length === 0) {
    return notServiceable(pincode, 'We do not deliver to this PIN code yet.')
  }

  const furnitureAvailable = usable.some((row) => row.furnitureAvailable)
  if (needsFurnitureHandling(input.lines) && !furnitureAvailable) {
    return notServiceable(
      pincode,
      'Furniture and heavy items need a specialist delivery route that is not available for this PIN code yet.',
    )
  }

  const env = getEnv()
  const freeShippingApplied = input.subtotal >= env.FREE_SHIPPING_THRESHOLD
  const shippingTotal = freeShippingApplied ? 0 : env.STANDARD_SHIPPING_FEE
  const codAvailable = usable.some((row) => row.codAvailable)
  const standardDays = Math.max(...usable.map((row) => row.standardDays))
  const estimated = new Date()
  estimated.setDate(estimated.getDate() + standardDays)

  return {
    pincode,
    serviceable: true,
    reason: null,
    shippingTotal,
    freeShippingApplied,
    codAvailable,
    codFee: input.paymentMethod === 'COD' ? env.COD_FEE : 0,
    standardDays,
    estimatedDeliveryDate: estimated.toISOString().slice(0, 10),
    installationAvailable: usable.some((row) => row.installationAvailable),
    city: usable.find((row) => row.city)?.city ?? null,
    state: usable.find((row) => row.state)?.state ?? null,
    warehouseId: usable.find((row) => row.warehouseId)?.warehouseId ?? null,
  }
}

export async function listServiceablePincodes(query?: string): Promise<ServiceablePincode[]> {
  const term = query?.trim()
  return prisma.serviceablePincode.findMany({
    where: term
      ? {
          OR: [
            { pincode: { contains: term } },
            { city: { contains: term, mode: 'insensitive' } },
            { state: { contains: term, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: [{ pincode: 'asc' }, { createdAt: 'asc' }],
    include: { warehouse: { select: { id: true, name: true, code: true } } },
  })
}

export async function createServiceablePincode(
  input: ServiceablePincodeInput,
): Promise<ServiceablePincode> {
  if (input.warehouseId) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } })
    if (!warehouse) throw new NotFoundError('That warehouse could not be found.')
  }

  return prisma.serviceablePincode.create({
    data: {
      pincode: input.pincode,
      warehouseId: input.warehouseId,
      city: input.city || null,
      state: input.state || null,
      codAvailable: input.codAvailable,
      standardDays: input.standardDays,
      furnitureAvailable: input.furnitureAvailable,
      installationAvailable: input.installationAvailable,
      isActive: input.isActive,
    },
  })
}

export async function updateServiceablePincode(
  id: string,
  input: ServiceablePincodeInput,
): Promise<ServiceablePincode> {
  const existing = await prisma.serviceablePincode.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('That PIN code entry could not be found.')

  if (input.warehouseId) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } })
    if (!warehouse) throw new NotFoundError('That warehouse could not be found.')
  }

  return prisma.serviceablePincode.update({
    where: { id },
    data: {
      pincode: input.pincode,
      warehouseId: input.warehouseId,
      city: input.city || null,
      state: input.state || null,
      codAvailable: input.codAvailable,
      standardDays: input.standardDays,
      furnitureAvailable: input.furnitureAvailable,
      installationAvailable: input.installationAvailable,
      isActive: input.isActive,
    },
  })
}

export async function deleteServiceablePincode(id: string): Promise<void> {
  const existing = await prisma.serviceablePincode.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('That PIN code entry could not be found.')
  await prisma.serviceablePincode.delete({ where: { id } })
}

export function assertServiceable(quote: ShippingQuote): void {
  if (!quote.serviceable) {
    throw new ValidationError(quote.reason ?? 'This PIN code is not serviceable.')
  }
}
