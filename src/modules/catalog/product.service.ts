import 'server-only'

import Decimal from 'decimal.js'

import type { Prisma } from '@/generated/prisma/client'
import { AUDIT_EVENTS, audit } from '@/lib/auth/audit'
import {
  ConflictError,
  NotFoundError,
  UnprocessableError,
  ValidationError,
} from '@/lib/errors'
import type { RequestContext } from '@/lib/http'
import { roundMoney } from '@/lib/money'
import { prisma } from '@/lib/prisma'
import { slugify, slugWithSuffix } from '@/lib/slug'
import {
  findProductById,
  getPlatformSeller,
  productCardSelect,
  productDetailInclude,
  type ProductCard,
} from './catalog.repository'
import { adminProductView } from './catalog.presenter'
import type {
  ProductInput,
  ProductPriceInput,
  ProductUpdateInput,
  SpecificationInput,
  VariantInput,
  VariantUpdateInput,
} from './catalog.schema'
import { generateVariantCombinations, matrixSkuSuffix } from './matrix'
import { validateProductForPublish } from './publish'
import { bumpCatalogVersion } from './catalog.version'

function moneyString(value: number): string {
  return roundMoney(value).toFixed(2)
}

function quantityString(value: number): string {
  return new Decimal(value).toFixed(3)
}

async function uniqueProductSlug(base: string): Promise<string> {
  const root = slugify(base, 'product')
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = slugWithSuffix(root, attempt)
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing) return candidate
  }
  throw new ConflictError('Could not allocate a unique product slug.')
}

async function resolveCategory(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) throw new ValidationError('Category not found.')
  if (category.archivedAt) throw new ValidationError('Choose a category that is not archived.')
  return category
}

async function resolveBrand(brandId: string | null | undefined) {
  if (!brandId) return null
  const brand = await prisma.brand.findUnique({ where: { id: brandId } })
  if (!brand) throw new ValidationError('Brand not found.')
  return brand
}

type AttributeWithOptions = Prisma.AttributeDefinitionGetPayload<{
  include: { options: true }
}>

async function loadAttributes(ids: string[]): Promise<Map<string, AttributeWithOptions>> {
  if (ids.length === 0) return new Map()
  const rows = await prisma.attributeDefinition.findMany({
    where: { id: { in: [...new Set(ids)] } },
    include: { options: true },
  })
  return new Map(rows.map((row) => [row.id, row]))
}

function assertOption(attribute: AttributeWithOptions, optionId: string | undefined) {
  if (!optionId) {
    throw new ValidationError(`Attribute “${attribute.name}” needs an option.`)
  }
  const option = attribute.options.find((entry) => entry.id === optionId)
  if (!option) {
    throw new ValidationError(`The selected option is not valid for “${attribute.name}”.`)
  }
}

function productAttributeData(
  attributes: Map<string, AttributeWithOptions>,
  input: {
    attributeId: string
    optionId?: string
    valueText?: string | null
    valueNumber?: number | null
    valueBoolean?: boolean
  },
) {
  const attribute = attributes.get(input.attributeId)
  if (!attribute) throw new ValidationError('One or more product attributes do not exist.')

  switch (attribute.dataType) {
    case 'SELECT':
    case 'MULTI_SELECT': {
      assertOption(attribute, input.optionId)
      return {
        attributeId: attribute.id,
        optionId: input.optionId!,
        valueText: input.valueText ?? null,
        valueNumber: null,
        valueBoolean: null,
      }
    }
    case 'NUMBER': {
      if (input.valueNumber === undefined || input.valueNumber === null) {
        throw new ValidationError(`Attribute “${attribute.name}” needs a numeric value.`)
      }
      return {
        attributeId: attribute.id,
        optionId: null,
        valueText: null,
        valueNumber: quantityString(input.valueNumber),
        valueBoolean: null,
      }
    }
    case 'BOOLEAN': {
      if (input.valueBoolean === undefined) {
        throw new ValidationError(`Attribute “${attribute.name}” needs a yes/no value.`)
      }
      return {
        attributeId: attribute.id,
        optionId: null,
        valueText: null,
        valueNumber: null,
        valueBoolean: input.valueBoolean,
      }
    }
    default: {
      if (!input.valueText || input.valueText.trim() === '') {
        throw new ValidationError(`Attribute “${attribute.name}” needs a text value.`)
      }
      return {
        attributeId: attribute.id,
        optionId: null,
        valueText: input.valueText.trim(),
        valueNumber: null,
        valueBoolean: null,
      }
    }
  }
}

function variantAttributeData(
  attributes: Map<string, AttributeWithOptions>,
  input: {
    attributeId: string
    optionId?: string
    valueText?: string
    valueNumber?: number
  },
) {
  const attribute = attributes.get(input.attributeId)
  if (!attribute) throw new ValidationError('One or more variant attributes do not exist.')

  if (attribute.dataType === 'NUMBER') {
    if (input.valueNumber === undefined) {
      throw new ValidationError(`Variant attribute “${attribute.name}” needs a numeric value.`)
    }
    return {
      attributeId: attribute.id,
      optionId: null,
      valueText: null,
      valueNumber: quantityString(input.valueNumber),
    }
  }

  assertOption(attribute, input.optionId)
  return {
    attributeId: attribute.id,
    optionId: input.optionId!,
    valueText: input.valueText ?? null,
    valueNumber: null,
  }
}

function normaliseVariantDefaults(variants: VariantInput[]): VariantInput[] {
  const defaults = variants.filter((variant) => variant.isDefault)
  if (defaults.length > 1) {
    throw new ValidationError('Only one variant can be the default.')
  }
  if (defaults.length === 0) {
    return variants.map((variant, index) => ({ ...variant, isDefault: index === 0 }))
  }
  return variants
}

async function assertSkusAvailable(skus: string[], excludeVariantId?: string) {
  const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index)
  if (duplicates.length > 0) {
    throw new ConflictError(`Duplicate SKU in this request: ${duplicates.join(', ')}`)
  }
  const existing = await prisma.productVariant.findMany({
    where: {
      sku: { in: skus },
      ...(excludeVariantId ? { id: { not: excludeVariantId } } : {}),
    },
    select: { sku: true },
  })
  if (existing.length > 0) {
    throw new ConflictError(`SKU already in use: ${existing.map((row) => row.sku).join(', ')}`)
  }
}

function baseProductData(input: ProductInput | ProductUpdateInput) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.hsnCode !== undefined ? { hsnCode: input.hsnCode } : {}),
    ...(input.gstRate !== undefined ? { gstRate: moneyString(input.gstRate) } : {}),
    ...(input.priceIncludesTax !== undefined ? { priceIncludesTax: input.priceIncludesTax } : {}),
    ...(input.countryOfOrigin !== undefined ? { countryOfOrigin: input.countryOfOrigin } : {}),
    ...(input.manufacturerName !== undefined ? { manufacturerName: input.manufacturerName } : {}),
    ...(input.manufacturerAddress !== undefined
      ? { manufacturerAddress: input.manufacturerAddress }
      : {}),
    ...(input.packerName !== undefined ? { packerName: input.packerName } : {}),
    ...(input.importerName !== undefined ? { importerName: input.importerName } : {}),
    ...(input.netQuantity !== undefined
      ? { netQuantity: input.netQuantity == null ? null : quantityString(input.netQuantity) }
      : {}),
    ...(input.unitOfMeasure !== undefined ? { unitOfMeasure: input.unitOfMeasure } : {}),
    ...(input.unitSalePrice !== undefined
      ? {
          unitSalePrice:
            input.unitSalePrice == null ? null : moneyString(input.unitSalePrice),
        }
      : {}),
    ...(input.consumerCareEmail !== undefined
      ? { consumerCareEmail: input.consumerCareEmail }
      : {}),
    ...(input.consumerCarePhone !== undefined
      ? { consumerCarePhone: input.consumerCarePhone }
      : {}),
    ...(input.bisRegistrationNo !== undefined ? { bisRegistrationNo: input.bisRegistrationNo } : {}),
    ...(input.warrantyMonths !== undefined ? { warrantyMonths: input.warrantyMonths } : {}),
    ...(input.warrantyType !== undefined ? { warrantyType: input.warrantyType } : {}),
    ...(input.isReturnable !== undefined ? { isReturnable: input.isReturnable } : {}),
    ...(input.returnWindowDays !== undefined ? { returnWindowDays: input.returnWindowDays } : {}),
    ...(input.replacementAllowed !== undefined
      ? { replacementAllowed: input.replacementAllowed }
      : {}),
    ...(input.assemblyRequired !== undefined ? { assemblyRequired: input.assemblyRequired } : {}),
    ...(input.installationRequired !== undefined
      ? { installationRequired: input.installationRequired }
      : {}),
    ...(input.isFragile !== undefined ? { isFragile: input.isFragile } : {}),
    ...(input.isHeavy !== undefined ? { isHeavy: input.isHeavy } : {}),
    ...(input.shippingClass !== undefined ? { shippingClass: input.shippingClass } : {}),
    ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
    ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
    ...(input.searchKeywords !== undefined ? { searchKeywords: input.searchKeywords } : {}),
  }
}

export async function createProduct(
  input: ProductInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const [category, brand, seller] = await Promise.all([
    resolveCategory(input.categoryId),
    resolveBrand(input.brandId),
    getPlatformSeller(),
  ])

  const slug = input.slug ?? (await uniqueProductSlug(input.name))
  if (input.slug) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
    if (existing) throw new ConflictError('A product with this slug already exists.')
  }
  const existingSku = await prisma.product.findUnique({
    where: { baseSku: input.baseSku },
    select: { id: true },
  })
  if (existingSku) throw new ConflictError('A product with this base SKU already exists.')

  const variants = normaliseVariantDefaults(input.variants)
  await assertSkusAvailable(variants.map((variant) => variant.sku))

  const attributeIds = [
    ...(input.attributeValues ?? []).map((value) => value.attributeId),
    ...variants.flatMap((variant) =>
      (variant.attributeValues ?? []).map((value) => value.attributeId),
    ),
  ]
  const attributes = await loadAttributes(attributeIds)

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: input.name,
        slug,
        baseSku: input.baseSku,
        categoryId: category.id,
        brandId: brand?.id ?? null,
        sellerId: seller.id,
        status: 'DRAFT',
        ...baseProductData(input),
        variants: {
          create: variants.map((variant) => ({
            sku: variant.sku,
            name: variant.name,
            price: moneyString(variant.price),
            mrp: moneyString(variant.mrp),
            costPrice: variant.costPrice == null ? null : moneyString(variant.costPrice),
            taxRate: variant.taxRate == null ? null : moneyString(variant.taxRate),
            weightGrams: variant.weightGrams ?? null,
            lengthMm: variant.lengthMm ?? null,
            widthMm: variant.widthMm ?? null,
            heightMm: variant.heightMm ?? null,
            isDefault: variant.isDefault,
            isActive: variant.isActive,
            position: variant.position,
            attributeValues: {
              create: (variant.attributeValues ?? []).map((value) =>
                variantAttributeData(attributes, value),
              ),
            },
          })),
        },
        attributeValues: {
          create: (input.attributeValues ?? []).map((value) =>
            productAttributeData(attributes, value),
          ),
        },
        specifications: {
          create: (input.specifications ?? []).map((specification) => ({
            group: specification.group,
            label: specification.label,
            value: specification.value,
            sortOrder: specification.sortOrder,
          })),
        },
      },
      include: productDetailInclude,
    })

    const variantIdsBySku = new Map(created.variants.map((variant) => [variant.sku, variant.id]))
    const images = input.images ?? []
    if (images.length > 0) {
      const primaryIndex = images.findIndex((image) => image.isPrimary)
      await tx.productImage.createMany({
        data: images.map((image, index) => ({
          productId: created.id,
          variantId: image.variantId ? (variantIdsBySku.get(image.variantId) ?? null) : null,
          url: image.url,
          alt: image.alt,
          width: image.width ?? null,
          height: image.height ?? null,
          blurDataUrl: image.blurDataUrl ?? null,
          sortOrder: image.sortOrder,
          isPrimary: primaryIndex === -1 ? index === 0 : index === primaryIndex,
        })),
      })
    }

    const now = new Date()
    await tx.productPriceHistory.createMany({
      data: created.variants.map((variant) => ({
        variantId: variant.id,
        price: variant.price,
        mrp: variant.mrp,
        effectiveFrom: now,
        reason: 'Initial price',
        changedByUserId: actorId,
      })),
    })

    return tx.product.findUniqueOrThrow({ where: { id: created.id }, include: productDetailInclude })
  })

  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductCreated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Product',
    entityId: product.id,
    after: { name: product.name, slug: product.slug, baseSku: product.baseSku },
    ...context,
  })
  return product
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Product not found.')

  if (input.categoryId) await resolveCategory(input.categoryId)
  if (input.brandId !== undefined) await resolveBrand(input.brandId)

  if (input.slug && input.slug !== existing.slug) {
    const duplicate = await prisma.product.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    })
    if (duplicate) throw new ConflictError('A product with this slug already exists.')
  }
  if (input.baseSku && input.baseSku !== existing.baseSku) {
    const duplicate = await prisma.product.findUnique({
      where: { baseSku: input.baseSku },
      select: { id: true },
    })
    if (duplicate) throw new ConflictError('A product with this base SKU already exists.')
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...baseProductData(input),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.baseSku !== undefined ? { baseSku: input.baseSku } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.brandId !== undefined ? { brandId: input.brandId } : {}),
    },
    include: productDetailInclude,
  })

  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Product',
    entityId: id,
    before: { name: existing.name, slug: existing.slug },
    after: { name: product.name, slug: product.slug },
    ...context,
  })
  return product
}

export async function deleteProduct(
  id: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  })
  if (!product) throw new NotFoundError('Product not found.')
  if (product._count.orderItems > 0) {
    throw new ConflictError('Products with order history must be archived, not deleted.')
  }

  await prisma.product.delete({ where: { id } })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductDeleted,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Product',
    entityId: id,
    before: { name: product.name, slug: product.slug },
    ...context,
  })
}

export async function publishProduct(
  id: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const product = await findProductById(id)
  if (!product) throw new NotFoundError('Product not found.')

  const required = await prisma.categoryAttribute.findMany({
    where: { categoryId: product.categoryId, isRequired: true },
    select: { attribute: { select: { code: true } } },
  })
  const issues = validateProductForPublish(product, {
    requiredAttributeCodes: required.map((entry) => entry.attribute.code),
  })
  if (issues.length > 0) {
    throw new UnprocessableError(
      `${issues.length} declaration${issues.length === 1 ? '' : 's'} need attention before publishing.`,
      issues,
    )
  }

  const published = await prisma.product.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      publishedAt: product.publishedAt ?? new Date(),
      archivedAt: null,
    },
    include: productDetailInclude,
  })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductPublished,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Product',
    entityId: id,
    before: { status: product.status },
    after: { status: published.status },
    ...context,
  })
  return published
}

export async function archiveProduct(
  id: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new NotFoundError('Product not found.')

  const archived = await prisma.product.update({
    where: { id },
    data: { status: 'ARCHIVED', archivedAt: new Date() },
    include: productDetailInclude,
  })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductArchived,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Product',
    entityId: id,
    before: { status: product.status },
    after: { status: archived.status },
    ...context,
  })
  return archived
}

export async function getAdminProduct(id: string) {
  const product = await findProductById(id)
  if (!product) throw new NotFoundError('Product not found.')
  const required = await prisma.categoryAttribute.findMany({
    where: { categoryId: product.categoryId, isRequired: true },
    select: { attribute: { select: { code: true } } },
  })
  const issues = validateProductForPublish(product, {
    requiredAttributeCodes: required.map((entry) => entry.attribute.code),
  })
  return { product: adminProductView(product), issues }
}

export interface AdminProductListResult {
  items: ProductCard[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function listAdminProducts(query: {
  q?: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'ALL'
  categoryId?: string
  brandId?: string
  page: number
  limit: number
}): Promise<AdminProductListResult> {
  const where: Prisma.ProductWhereInput = {
    ...(query.status !== 'ALL' ? { status: query.status } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.brandId ? { brandId: query.brandId } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { baseSku: { contains: query.q, mode: 'insensitive' } },
            { variants: { some: { sku: { contains: query.q, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: productCardSelect,
    }),
    prisma.product.count({ where }),
  ])

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  }
}

export async function addVariant(
  productId: string,
  input: VariantInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { select: { id: true, isDefault: true, isActive: true } } },
  })
  if (!product) throw new NotFoundError('Product not found.')
  await assertSkusAvailable([input.sku])
  const attributes = await loadAttributes(
    (input.attributeValues ?? []).map((value) => value.attributeId),
  )
  const makeDefault = input.isDefault || !product.variants.some((variant) => variant.isDefault)

  const variant = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.productVariant.updateMany({
        where: { productId },
        data: { isDefault: false },
      })
    }
    const created = await tx.productVariant.create({
      data: {
        productId,
        sku: input.sku,
        name: input.name,
        price: moneyString(input.price),
        mrp: moneyString(input.mrp),
        costPrice: input.costPrice == null ? null : moneyString(input.costPrice),
        taxRate: input.taxRate == null ? null : moneyString(input.taxRate),
        weightGrams: input.weightGrams ?? null,
        lengthMm: input.lengthMm ?? null,
        widthMm: input.widthMm ?? null,
        heightMm: input.heightMm ?? null,
        isDefault: makeDefault || input.isDefault,
        isActive: input.isActive,
        position: input.position,
        attributeValues: {
          create: (input.attributeValues ?? []).map((value) =>
            variantAttributeData(attributes, value),
          ),
        },
      },
    })
    await tx.productPriceHistory.create({
      data: {
        variantId: created.id,
        price: created.price,
        mrp: created.mrp,
        effectiveFrom: new Date(),
        reason: 'Initial price',
        changedByUserId: actorId,
      },
    })
    return created
  })

  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogVariantCreated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductVariant',
    entityId: variant.id,
    after: { productId, sku: variant.sku, price: variant.price.toString() },
    ...context,
  })
  return variant
}

export async function updateVariant(
  variantId: string,
  input: VariantUpdateInput,
  actorId: string,
  reason: string | undefined,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const existing = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (!existing) throw new NotFoundError('Variant not found.')
  if (input.sku && input.sku !== existing.sku) await assertSkusAvailable([input.sku], variantId)

  const attributes = await loadAttributes(
    (input.attributeValues ?? []).map((value) => value.attributeId),
  )

  const nextPrice = input.price !== undefined ? moneyString(input.price) : existing.price.toString()
  const nextMrp = input.mrp !== undefined ? moneyString(input.mrp) : existing.mrp.toString()
  if (new Decimal(nextMrp).lessThan(nextPrice)) {
    throw new ValidationError('MRP must be greater than or equal to the selling price.')
  }

  const priceChanged =
    !new Decimal(nextPrice).equals(existing.price.toString()) ||
    !new Decimal(nextMrp).equals(existing.mrp.toString())

  const variant = await prisma.$transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx.productVariant.updateMany({
        where: { productId: existing.productId, id: { not: variantId } },
        data: { isDefault: false },
      })
    }

    if (input.attributeValues !== undefined) {
      await tx.variantAttributeValue.deleteMany({ where: { variantId } })
    }

    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: {
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        price: nextPrice,
        mrp: nextMrp,
        ...(input.costPrice !== undefined
          ? { costPrice: input.costPrice == null ? null : moneyString(input.costPrice) }
          : {}),
        ...(input.taxRate !== undefined
          ? { taxRate: input.taxRate == null ? null : moneyString(input.taxRate) }
          : {}),
        ...(input.weightGrams !== undefined ? { weightGrams: input.weightGrams } : {}),
        ...(input.lengthMm !== undefined ? { lengthMm: input.lengthMm } : {}),
        ...(input.widthMm !== undefined ? { widthMm: input.widthMm } : {}),
        ...(input.heightMm !== undefined ? { heightMm: input.heightMm } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
        ...(input.attributeValues !== undefined
          ? {
              attributeValues: {
                create: input.attributeValues.map((value) =>
                  variantAttributeData(attributes, value),
                ),
              },
            }
          : {}),
      },
      include: {
        attributeValues: { include: { attribute: true, option: true } },
        priceHistory: { orderBy: { effectiveFrom: 'desc' }, take: 60 },
      },
    })

    if (priceChanged) {
      const now = new Date()
      await tx.productPriceHistory.updateMany({
        where: { variantId, effectiveTo: null },
        data: { effectiveTo: now },
      })
      await tx.productPriceHistory.create({
        data: {
          variantId,
          price: nextPrice,
          mrp: nextMrp,
          effectiveFrom: now,
          reason: reason?.trim() || 'Price update',
          changedByUserId: actorId,
        },
      })
    }

    if (updated.isActive === false && updated.isDefault) {
      const fallback = await tx.productVariant.findFirst({
        where: { productId: existing.productId, isActive: true, id: { not: variantId } },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      })
      if (fallback) {
        await tx.productVariant.update({
          where: { id: fallback.id },
          data: { isDefault: true },
        })
        await tx.productVariant.update({ where: { id: variantId }, data: { isDefault: false } })
      }
    }

    return tx.productVariant.findUniqueOrThrow({
      where: { id: variantId },
      include: {
        attributeValues: { include: { attribute: true, option: true } },
        priceHistory: { orderBy: { effectiveFrom: 'desc' }, take: 60 },
      },
    })
  })

  await bumpCatalogVersion()
  await audit({
    action: priceChanged ? AUDIT_EVENTS.catalogPriceChanged : AUDIT_EVENTS.catalogVariantUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductVariant',
    entityId: variantId,
    before: { price: existing.price.toString(), mrp: existing.mrp.toString() },
    after: { price: variant.price.toString(), mrp: variant.mrp.toString() },
    ...context,
  })
  return variant
}

export async function changeVariantPrice(
  variantId: string,
  input: ProductPriceInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  return updateVariant(
    variantId,
    { price: input.price, mrp: input.mrp },
    actorId,
    input.reason,
    context,
  )
}

export async function deleteVariant(
  variantId: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { _count: { select: { orderItems: true, inventory: true } } },
  })
  if (!variant) throw new NotFoundError('Variant not found.')
  if (variant._count.orderItems > 0) {
    throw new ConflictError('Variants with order history must be deactivated, not deleted.')
  }
  if (variant._count.inventory > 0) {
    throw new ConflictError('Remove inventory records before deleting this variant.')
  }

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.delete({ where: { id: variantId } })
    if (variant.isDefault) {
      const fallback = await tx.productVariant.findFirst({
        where: { productId: variant.productId, isActive: true },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      })
      if (fallback) {
        await tx.productVariant.update({
          where: { id: fallback.id },
          data: { isDefault: true },
        })
      }
    }
  })

  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogVariantDeleted,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductVariant',
    entityId: variantId,
    before: { sku: variant.sku, productId: variant.productId },
    ...context,
  })
}

export async function addProductImage(
  productId: string,
  input: {
    url: string
    alt: string
    variantId?: string
    width?: number | null
    height?: number | null
    blurDataUrl?: string | null
    sortOrder?: number
    isPrimary?: boolean
  },
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new NotFoundError('Product not found.')
  if (input.variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: input.variantId, productId },
      select: { id: true },
    })
    if (!variant) throw new ValidationError('The selected variant does not belong to this product.')
  }

  const image = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } })
    }
    return tx.productImage.create({
      data: {
        productId,
        variantId: input.variantId ?? null,
        url: input.url,
        alt: input.alt,
        width: input.width ?? null,
        height: input.height ?? null,
        blurDataUrl: input.blurDataUrl ?? null,
        sortOrder: input.sortOrder ?? 0,
        isPrimary: input.isPrimary ?? false,
      },
    })
  })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductImage',
    entityId: image.id,
    after: { productId, url: image.url },
    ...context,
  })
  return image
}

export async function deleteProductImage(
  imageId: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } })
  if (!image) throw new NotFoundError('Image not found.')

  await prisma.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id: imageId } })
    if (image.isPrimary) {
      const next = await tx.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      })
      if (next) {
        await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
      }
    }
  })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductImage',
    entityId: imageId,
    before: { productId: image.productId, url: image.url },
    ...context,
  })
}

export async function addSpecification(
  productId: string,
  input: SpecificationInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new NotFoundError('Product not found.')
  const specification = await prisma.productSpecification.create({
    data: {
      productId,
      group: input.group,
      label: input.label,
      value: input.value,
      sortOrder: input.sortOrder,
    },
  })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductSpecification',
    entityId: specification.id,
    after: { productId, label: specification.label },
    ...context,
  })
  return specification
}

export async function deleteSpecification(
  specificationId: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const specification = await prisma.productSpecification.findUnique({
    where: { id: specificationId },
  })
  if (!specification) throw new NotFoundError('Specification not found.')
  await prisma.productSpecification.delete({ where: { id: specificationId } })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductSpecification',
    entityId: specificationId,
    before: { productId: specification.productId, label: specification.label },
    ...context,
  })
}

export async function setProductAttribute(
  productId: string,
  input: {
    attributeId: string
    optionId?: string
    valueText?: string | null
    valueNumber?: number | null
    valueBoolean?: boolean
  },
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new NotFoundError('Product not found.')
  const attributes = await loadAttributes([input.attributeId])
  const data = productAttributeData(attributes, input)

  const value = await prisma.productAttributeValue.upsert({
    where: { productId_attributeId: { productId, attributeId: input.attributeId } },
    update: data,
    create: { productId, ...data },
  })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductAttributeValue',
    entityId: value.id,
    after: { productId, attributeId: input.attributeId },
    ...context,
  })
  return value
}

export async function removeProductAttribute(
  productId: string,
  attributeId: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const value = await prisma.productAttributeValue.findUnique({
    where: { productId_attributeId: { productId, attributeId } },
  })
  if (!value) throw new NotFoundError('Product attribute value not found.')
  await prisma.productAttributeValue.delete({ where: { id: value.id } })
  await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogProductUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'ProductAttributeValue',
    entityId: value.id,
    before: { productId, attributeId },
    ...context,
  })
}

export async function generateVariantMatrixForProduct(
  productId: string,
  input: { attributeCodes: string[]; baseSku?: string; namePrefix?: string },
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        include: { attributeValues: true },
      },
    },
  })
  if (!product) throw new NotFoundError('Product not found.')

  const attributes = await prisma.attributeDefinition.findMany({
    where: { code: { in: input.attributeCodes }, isActive: true },
    include: { options: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
  })
  if (attributes.length !== new Set(input.attributeCodes).size) {
    throw new ValidationError('One or more variant axes are invalid or inactive.')
  }
  for (const attribute of attributes) {
    if (!attribute.isVariantAxis) {
      throw new ValidationError(`Attribute “${attribute.name}” is not configured as a variant axis.`)
    }
    if (attribute.options.length === 0) {
      throw new ValidationError(`Attribute “${attribute.name}” has no active options.`)
    }
  }

  const combinations = generateVariantCombinations(
    attributes.map((attribute) => ({
      code: attribute.code,
      name: attribute.name,
      options: attribute.options.map((option) => ({
        id: option.id,
        value: option.value,
        label: option.label,
      })),
    })),
  )
  if (combinations.length > 100) {
    throw new ValidationError('Variant matrix exceeds 100 combinations; reduce the axes.')
  }

  const codeById = new Map(attributes.map((attribute) => [attribute.id, attribute.code]))
  const existingKeys = new Set(
    product.variants.map((variant) =>
      variant.attributeValues
        .map((value) => `${codeById.get(value.attributeId) ?? value.attributeId}:${value.optionId ?? ''}`)
        .sort()
        .join('|'),
    ),
  )
  const template = product.variants.find((variant) => variant.isDefault) ?? product.variants[0]
  if (!template) throw new ValidationError('Add a base variant before generating a matrix.')

  const prefix = input.baseSku ?? product.baseSku
  const namePrefix = input.namePrefix ?? product.name
  const created: string[] = []

  for (const combination of combinations) {
    if (existingKeys.has(combination.key)) continue

    const suffix = matrixSkuSuffix(combination)
    const base = `${prefix}-${suffix}`.slice(0, 76)
    let sku = base
    let attempt = 0
    while (
      await prisma.productVariant.findUnique({ where: { sku }, select: { id: true } })
    ) {
      attempt += 1
      sku = `${base}-${attempt}`
    }

    await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku,
          name: `${namePrefix} — ${combination.labels.join(', ')}`.slice(0, 160),
          price: template.price,
          mrp: template.mrp,
          costPrice: template.costPrice,
          taxRate: template.taxRate,
          weightGrams: template.weightGrams,
          lengthMm: template.lengthMm,
          widthMm: template.widthMm,
          heightMm: template.heightMm,
          isDefault: false,
          isActive: true,
          position: product.variants.length + created.length,
          attributeValues: {
            create: combination.axes.map((entry) => {
              const attribute = attributes.find((row) => row.code === entry.code)!
              return { attributeId: attribute.id, optionId: entry.option.id }
            }),
          },
        },
      })
      await tx.productPriceHistory.create({
        data: {
          variantId: variant.id,
          price: variant.price,
          mrp: variant.mrp,
          effectiveFrom: new Date(),
          reason: 'Variant matrix generated',
          changedByUserId: actorId,
        },
      })
    })
    created.push(sku)
  }

  if (created.length > 0) await bumpCatalogVersion()
  await audit({
    action: AUDIT_EVENTS.catalogVariantCreated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Product',
    entityId: productId,
    after: { generated: created.length, skus: created },
    ...context,
  })
  return { created: created.length, skus: created }
}
