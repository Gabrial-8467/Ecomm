import 'server-only'

import { z } from 'zod'

import type { Address } from '@/generated/prisma/client'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

export const addressInputSchema = z.object({
  label: z.string().trim().max(40).optional().default(''),
  fullName: z.string().trim().min(2, 'Enter the recipient’s full name.').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-()\s]{6,20}$/, 'Enter a valid phone number.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .max(254)
    .optional()
    .or(z.literal('')),
  line1: z.string().trim().min(5, 'Enter the street address.').max(160),
  line2: z.string().trim().max(160).optional().default(''),
  landmark: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().min(2, 'Enter the city.').max(80),
  state: z.string().trim().min(2, 'Enter the state.').max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN code.'),
  country: z.string().trim().length(2).default('IN'),
  type: z.enum(['SHIPPING', 'BILLING', 'BOTH']).default('BOTH'),
  isDefaultShipping: z.boolean().default(false),
})

export type AddressInput = z.infer<typeof addressInputSchema>

export const addressUpdateSchema = addressInputSchema.partial()

export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>

export async function listAddresses(userId: string): Promise<Address[]> {
  return prisma.address.findMany({
    where: { userId, deletedAt: null },
    orderBy: [
      { isDefaultShipping: 'desc' },
      { isDefaultBilling: 'desc' },
      { createdAt: 'desc' },
    ],
  })
}

export async function getAddress(userId: string, id: string): Promise<Address> {
  const address = await prisma.address.findFirst({ where: { id, userId, deletedAt: null } })
  if (!address) throw new NotFoundError('That address could not be found.')
  return address
}

async function clearDefaults(
  userId: string,
  field: 'isDefaultShipping' | 'isDefaultBilling',
): Promise<void> {
  await prisma.address.updateMany({
    where: { userId, deletedAt: null, [field]: true },
    data: { [field]: false },
  })
}

export async function createAddress(userId: string, input: AddressInput): Promise<Address> {
  const existingCount = await prisma.address.count({ where: { userId, deletedAt: null } })
  const makeDefault = input.isDefaultShipping || existingCount === 0

  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId, deletedAt: null, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      })
    }
    return tx.address.create({
      data: {
        userId,
        label: input.label || null,
        type: input.type,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email || null,
        line1: input.line1,
        line2: input.line2 || null,
        landmark: input.landmark || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        country: input.country || 'IN',
        isDefaultShipping: makeDefault,
        isDefaultBilling: existingCount === 0,
      },
    })
  })
}

export async function updateAddress(
  userId: string,
  id: string,
  input: AddressUpdateInput,
): Promise<Address> {
  const existing = await getAddress(userId, id)
  if (input.pincode && input.pincode !== existing.pincode) {
    throw new ValidationError(
      'PIN code changes need a new address. Add a new address so past orders keep their delivery record.',
    )
  }

  return prisma.address.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label || null } : {}),
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
      ...(input.line2 !== undefined ? { line2: input.line2 || null } : {}),
      ...(input.landmark !== undefined ? { landmark: input.landmark || null } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
    },
  })
}

export async function setDefaultAddress(
  userId: string,
  id: string,
  kind: 'shipping' | 'billing',
): Promise<void> {
  await getAddress(userId, id)
  const field = kind === 'shipping' ? 'isDefaultShipping' : 'isDefaultBilling'
  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { userId, deletedAt: null, [field]: true },
      data: { [field]: false },
    })
    await tx.address.update({ where: { id }, data: { [field]: true } })
  })
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const existing = await getAddress(userId, id)
  await prisma.address.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), isDefaultShipping: false, isDefaultBilling: false },
  })
}

export function addressSnapshot(address: Address) {
  return {
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    email: address.email,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
  }
}

export { clearDefaults }
