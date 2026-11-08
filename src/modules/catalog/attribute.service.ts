import 'server-only'

import { AUDIT_EVENTS, audit } from '@/lib/auth/audit'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import type { RequestContext } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import {
  findAttributeByCode,
  findAttributeById,
  listAttributes,
} from './catalog.repository'
import type { AttributeInput, AttributeUpdateInput } from './catalog.schema'

export async function getAttributes(options: { includeInactive?: boolean } = {}) {
  return listAttributes(options.includeInactive)
}

export async function getAttribute(id: string) {
  const attribute = await findAttributeById(id)
  if (!attribute) throw new NotFoundError('Attribute not found.')
  return attribute
}

export async function getAttributeByCode(code: string) {
  const attribute = await findAttributeByCode(code)
  if (!attribute) throw new NotFoundError('Attribute not found.')
  return attribute
}

function validateOptions(
  dataType: string,
  options: { value: string; label: string }[] | undefined,
  requireOne: boolean,
) {
  if (dataType === 'SELECT' || dataType === 'MULTI_SELECT') {
    if (requireOne && (!options || options.length === 0)) {
      throw new ValidationError('Select attributes need at least one option.')
    }
    const values = new Set<string>()
    for (const option of options ?? []) {
      const key = option.value.trim().toLowerCase()
      if (values.has(key)) {
        throw new ValidationError(`Duplicate option value: ${option.value}`)
      }
      values.add(key)
    }
    return
  }

  if (options && options.length > 0) {
    throw new ValidationError('Only select attributes can define options.')
  }
}

export async function createAttribute(
  input: AttributeInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const existing = await prisma.attributeDefinition.findUnique({
    where: { code: input.code },
    select: { id: true },
  })
  if (existing) throw new ConflictError('An attribute with this code already exists.')

  validateOptions(input.dataType, input.options, true)

  const attribute = await prisma.attributeDefinition.create({
    data: {
      code: input.code,
      name: input.name,
      dataType: input.dataType,
      unit: input.unit ?? null,
      isVariantAxis: input.isVariantAxis,
      isFilterable: input.isFilterable,
      isComparable: input.isComparable,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      options: input.options?.length
        ? {
            create: input.options.map((option) => ({
              value: option.value,
              label: option.label,
              sortOrder: option.sortOrder,
              isActive: option.isActive,
            })),
          }
        : undefined,
    },
    include: { options: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
  })

  await audit({
    action: AUDIT_EVENTS.catalogAttributeCreated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'AttributeDefinition',
    entityId: attribute.id,
    after: { code: attribute.code, name: attribute.name },
    ...context,
  })
  return attribute
}

export async function updateAttribute(
  id: string,
  input: AttributeUpdateInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const existing = await prisma.attributeDefinition.findUnique({
    where: { id },
    include: { options: true },
  })
  if (!existing) throw new NotFoundError('Attribute not found.')

  if (input.code && input.code !== existing.code) {
    const duplicate = await prisma.attributeDefinition.findUnique({
      where: { code: input.code },
      select: { id: true },
    })
    if (duplicate) throw new ConflictError('An attribute with this code already exists.')
  }

  const dataType = input.dataType ?? existing.dataType
  if (input.options !== undefined) {
    validateOptions(dataType, input.options, dataType === 'SELECT' || dataType === 'MULTI_SELECT')
  } else if (dataType !== 'SELECT' && dataType !== 'MULTI_SELECT' && existing.options.length > 0) {
    throw new ValidationError(
      'Deactivate the existing options before changing this attribute to a scalar type.',
    )
  }

  const attribute = await prisma.$transaction(async (tx) => {
    await tx.attributeDefinition.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.dataType !== undefined ? { dataType: input.dataType } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.isVariantAxis !== undefined ? { isVariantAxis: input.isVariantAxis } : {}),
        ...(input.isFilterable !== undefined ? { isFilterable: input.isFilterable } : {}),
        ...(input.isComparable !== undefined ? { isComparable: input.isComparable } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    })

    if (input.options !== undefined) {
      const providedValues = new Set(input.options.map((option) => option.value))
      for (const option of input.options) {
        await tx.attributeOption.upsert({
          where: { attributeId_value: { attributeId: id, value: option.value } },
          update: {
            label: option.label,
            sortOrder: option.sortOrder,
            isActive: option.isActive,
          },
          create: {
            attributeId: id,
            value: option.value,
            label: option.label,
            sortOrder: option.sortOrder,
            isActive: option.isActive,
          },
        })
      }
      await tx.attributeOption.updateMany({
        where: { attributeId: id, value: { notIn: [...providedValues] } },
        data: { isActive: false },
      })
    }

    return tx.attributeDefinition.findUniqueOrThrow({
      where: { id },
      include: { options: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
    })
  })

  await audit({
    action: AUDIT_EVENTS.catalogAttributeUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'AttributeDefinition',
    entityId: id,
    before: { code: existing.code, name: existing.name },
    after: { code: attribute.code, name: attribute.name },
    ...context,
  })
  return attribute
}

export async function deleteAttribute(
  id: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const attribute = await prisma.attributeDefinition.findUnique({
    where: { id },
    include: { _count: { select: { productValues: true, variantValues: true } } },
  })
  if (!attribute) throw new NotFoundError('Attribute not found.')
  if (attribute._count.productValues > 0 || attribute._count.variantValues > 0) {
    throw new ConflictError(
      'This attribute is used by products or variants. Deactivate it instead of deleting it.',
    )
  }

  await prisma.attributeDefinition.delete({ where: { id } })
  await audit({
    action: AUDIT_EVENTS.catalogAttributeDeleted,
    actorId,
    actorType: 'ADMIN',
    entityType: 'AttributeDefinition',
    entityId: id,
    before: { code: attribute.code, name: attribute.name },
    ...context,
  })
}
