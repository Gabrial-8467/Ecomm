import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

let sequence = 0

function nextKey(prefix: string): string {
  sequence += 1
  return `${prefix}-${sequence}-${crypto.randomUUID().slice(0, 6)}`
}

export async function createSeller(
  overrides: Partial<{
    legalName: string
    registeredAddress: unknown
    customerCareEmail: string | null
    customerCarePhone: string | null
  }> = {},
) {
  return prisma.seller.create({
    data: {
      legalName: overrides.legalName ?? 'CasaCircuit Retail Private Limited',
      displayName: 'CasaCircuit',
      status: 'ACTIVE',
      isPlatformOwner: true,
      registeredAddress:
        overrides.registeredAddress === undefined
          ? {
              line1: '1 Test Street',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560001',
              country: 'India',
            }
          : overrides.registeredAddress === null
            ? Prisma.JsonNull
            : overrides.registeredAddress,
      customerCareEmail:
        overrides.customerCareEmail === undefined
          ? 'care@example.com'
          : overrides.customerCareEmail,
      customerCarePhone: overrides.customerCarePhone ?? null,
    },
  })
}

export async function createCategory(input: {
  name?: string
  slug?: string
  parent?: { id: string; path: string; level: number } | null
  isActive?: boolean
  sortOrder?: number
}) {
  const slug = input.slug ?? nextKey('category')
  const parent = input.parent ?? null
  return prisma.category.create({
    data: {
      name: input.name ?? `Category ${slug}`,
      slug,
      parentId: parent?.id ?? null,
      path: parent ? `${parent.path}/${slug}` : `/${slug}`,
      level: parent ? parent.level + 1 : 0,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      returnWindowDays: 7,
      isReturnable: true,
      replacementAllowed: true,
    },
  })
}

export async function createBrand(name = 'Test Brand') {
  return prisma.brand.create({
    data: { name, slug: nextKey('brand'), isActive: true },
  })
}

export async function createAttribute(input: {
  code?: string
  name?: string
  dataType?: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT'
  isVariantAxis?: boolean
  isFilterable?: boolean
  unit?: string | null
  options?: string[]
}) {
  const code = input.code ?? `attr_${nextKey('code').replaceAll('-', '_')}`
  return prisma.attributeDefinition.create({
    data: {
      code,
      name: input.name ?? `Attribute ${code}`,
      dataType: input.dataType ?? 'SELECT',
      isVariantAxis: input.isVariantAxis ?? false,
      isFilterable: input.isFilterable ?? true,
      unit: input.unit ?? null,
      options: {
        create: (input.options ?? []).map((value, index) => ({
          value,
          label: value,
          sortOrder: index,
        })),
      },
    },
    include: { options: true },
  })
}

export async function createProductFixture(input: {
  sellerId: string
  categoryId: string
  brandId?: string | null
  name?: string
  slug?: string
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  price?: string
  mrp?: string
  completeDeclarations?: boolean
  image?: boolean
  publishedAt?: Date | null
  attributeValues?: {
    attributeId: string
    optionId?: string
    valueText?: string
    valueNumber?: number
  }[]
}) {
  const key = nextKey('product')
  const name = input.name ?? `Test Product ${key}`
  const slug = input.slug ?? key
  const price = input.price ?? '1000.00'
  const mrp = input.mrp ?? '1500.00'
  const complete = input.completeDeclarations ?? true

  return prisma.product.create({
    data: {
      name,
      slug,
      baseSku: `BASE-${key}`.toUpperCase(),
      categoryId: input.categoryId,
      brandId: input.brandId ?? null,
      sellerId: input.sellerId,
      status: input.status ?? 'DRAFT',
      publishedAt: input.publishedAt === undefined ? null : input.publishedAt,
      ...(complete
        ? {
            hsnCode: '94036000',
            gstRate: '18.00',
            priceIncludesTax: true,
            countryOfOrigin: 'IN',
            manufacturerName: 'Test Manufacturer',
            manufacturerAddress: '2 Industrial Estate, Bengaluru',
            packerName: 'Test Packer',
            netQuantity: '1.000',
            unitOfMeasure: 'piece',
            unitSalePrice: price,
            consumerCareEmail: 'care@example.com',
            warrantyType: 'MANUFACTURER' as const,
            warrantyMonths: 12,
            isReturnable: true,
            returnWindowDays: 7,
          }
        : {}),
      variants: {
        create: [
          {
            sku: `SKU-${key}`.toUpperCase(),
            name: `${name} — default`,
            price,
            mrp,
            isDefault: true,
            isActive: true,
            position: 0,
          },
        ],
      },
      ...(input.image === false
        ? {}
        : {
            images: {
              create: [
                {
                  url: `https://cdn.example.com/${slug}.jpg`,
                  alt: `${name} product photograph`,
                  isPrimary: true,
                  sortOrder: 0,
                },
              ],
            },
          }),
      ...(input.attributeValues && input.attributeValues.length > 0
        ? {
            attributeValues: {
              create: input.attributeValues.map((value) => ({
                attributeId: value.attributeId,
                optionId: value.optionId ?? null,
                valueText: value.valueText ?? null,
                valueNumber: value.valueNumber ?? null,
              })),
            },
          }
        : {}),
    },
    include: { variants: true, images: true },
  })
}
