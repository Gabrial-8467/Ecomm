import { z } from 'zod'

/**
 * Catalogue input contracts.
 *
 * These schemas describe JSON payloads (REST) and are also the source of truth
 * for the admin server actions. All money values arrive as numbers or numeric
 * strings and are normalised to two-decimal strings before they reach Prisma.
 */

const money = z.coerce
  .number()
  .finite('Enter a valid amount.')
  .min(0, 'Amount cannot be negative.')
  .max(99_999_999_999.99, 'Amount is too large.')

const optionalMoney = z
  .union([money, z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === null || value === undefined ? null : value))

const optionalInt = (min: number, max: number) =>
  z
    .union([z.coerce.number().int().min(min).max(max), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value === '' || value === null || value === undefined ? null : value))

const nullableText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal(''), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined
      if (value === null || value === '') return null
      return value
    })

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.')

export const shippingClassSchema = z.enum(['STANDARD', 'FURNITURE', 'FRAGILE', 'HEAVY'])
export const warrantyTypeSchema = z.enum(['NONE', 'MANUFACTURER', 'SELLER'])
export const attributeDataTypeSchema = z.enum([
  'TEXT',
  'NUMBER',
  'BOOLEAN',
  'SELECT',
  'MULTI_SELECT',
])

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoryInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a category name.').max(120),
    slug: slug.optional(),
    parentId: z
      .union([z.string().trim().min(1).max(64), z.literal(''), z.null()])
      .optional()
      .transform((value) => (value === '' || value === null || value === undefined ? null : value)),
    description: nullableText(5_000),
    imageUrl: nullableText(2_048),
    icon: nullableText(80),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
    seoTitle: nullableText(120),
    seoDescription: nullableText(320),
    returnWindowDays: z.coerce.number().int().min(0).max(365).default(7),
    isReturnable: z.boolean().default(true),
    replacementAllowed: z.boolean().default(true),
    warrantyMonths: optionalInt(0, 240),
    shippingClass: shippingClassSchema.default('STANDARD'),
  })
  .strict()

export const categoryUpdateSchema = categoryInputSchema.partial()

export const categoryAttributeAssignmentSchema = z
  .object({
    attributes: z
      .array(
        z
          .object({
            attributeId: z.string().trim().min(1).max(64),
            isRequired: z.boolean().default(false),
            isFilterable: z.boolean().default(true),
            sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
          })
          .strict(),
      )
      .max(200),
  })
  .strict()

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export const brandInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a brand name.').max(120),
    slug: slug.optional(),
    logoUrl: nullableText(2_048),
    description: nullableText(5_000),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    seoTitle: nullableText(120),
    seoDescription: nullableText(320),
  })
  .strict()

export const brandUpdateSchema = brandInputSchema.partial()

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

export const attributeOptionInputSchema = z
  .object({
    id: z.string().trim().min(1).max(64).optional(),
    value: z.string().trim().min(1).max(120),
    label: z.string().trim().min(1).max(120),
    sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict()

const attributeObjectSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(40)
      .regex(/^[a-z][a-z0-9_]*$/, 'Use lowercase letters, numbers and underscores.'),
    name: z.string().trim().min(1, 'Enter an attribute name.').max(120),
    dataType: attributeDataTypeSchema.default('SELECT'),
    unit: nullableText(40),
    isVariantAxis: z.boolean().default(false),
    isFilterable: z.boolean().default(true),
    isComparable: z.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
    isActive: z.boolean().default(true),
    options: z.array(attributeOptionInputSchema).max(500).optional(),
  })
  .strict()

export const attributeInputSchema = attributeObjectSchema.superRefine((value, ctx) => {
  if (
    (value.dataType === 'SELECT' || value.dataType === 'MULTI_SELECT') &&
    value.options !== undefined &&
    value.options.length === 0
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['options'],
      message: 'Select attributes need at least one option.',
    })
  }
  if (value.isVariantAxis && value.dataType !== 'SELECT' && value.dataType !== 'NUMBER') {
    ctx.addIssue({
      code: 'custom',
      path: ['dataType'],
      message: 'Variant axes must be SELECT or NUMBER attributes.',
    })
  }
})

export const attributeUpdateSchema = attributeObjectSchema.partial()

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const variantAttributeValueSchema = z
  .object({
    attributeId: z.string().trim().min(1).max(64),
    optionId: z.string().trim().min(1).max(64).optional(),
    valueText: z.string().trim().max(500).optional(),
    valueNumber: z.coerce.number().finite().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.optionId !== undefined ||
      value.valueText !== undefined ||
      value.valueNumber !== undefined,
    { message: 'Provide an option or a scalar value.' },
  )

const variantObjectSchema = z
  .object({
    sku: z.string().trim().min(1, 'Enter a SKU.').max(80),
    name: z.string().trim().min(1, 'Enter a variant name.').max(160),
    price: money,
    mrp: money,
    costPrice: optionalMoney,
    taxRate: optionalMoney,
    weightGrams: optionalInt(0, 1_000_000),
    lengthMm: optionalInt(0, 100_000),
    widthMm: optionalInt(0, 100_000),
    heightMm: optionalInt(0, 100_000),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
    position: z.coerce.number().int().min(0).max(10_000).default(0),
    attributeValues: z.array(variantAttributeValueSchema).max(100).optional(),
  })
  .strict()

export const variantInputSchema = variantObjectSchema.refine(
  (value) => value.mrp >= value.price,
  {
    path: ['mrp'],
    message: 'MRP must be greater than or equal to the selling price.',
  },
)

export const variantUpdateSchema = variantObjectSchema.partial()

export const productImageInputSchema = z
  .object({
    url: z.string().trim().min(1, 'Enter an image URL.').max(2_048),
    alt: z.string().trim().min(1, 'Describe the image for accessibility.').max(300),
    variantId: z.string().trim().min(1).max(64).optional(),
    width: optionalInt(1, 50_000),
    height: optionalInt(1, 50_000),
    blurDataUrl: nullableText(8_192),
    sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
    isPrimary: z.boolean().default(false),
  })
  .strict()

export const specificationInputSchema = z
  .object({
    group: z.string().trim().min(1).max(120).default('General'),
    label: z.string().trim().min(1).max(160),
    value: z.string().trim().min(1).max(2_000),
    sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
  })
  .strict()

export const productAttributeValueInputSchema = z
  .object({
    attributeId: z.string().trim().min(1).max(64),
    optionId: z.string().trim().min(1).max(64).optional(),
    valueText: nullableText(500),
    valueNumber: optionalMoney,
    valueBoolean: z.boolean().optional(),
  })
  .strict()

export const productInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a product name.').max(240),
    slug: slug.optional(),
    baseSku: z.string().trim().min(1, 'Enter a base SKU.').max(80),
    categoryId: z.string().trim().min(1, 'Choose a category.').max(64),
    brandId: z
      .union([z.string().trim().min(1).max(64), z.literal(''), z.null()])
      .optional()
      .transform((value) => (value === '' || value === null || value === undefined ? null : value)),
    shortDescription: nullableText(1_000),
    description: nullableText(20_000),
    hsnCode: nullableText(20),
    gstRate: z.coerce.number().min(0).max(100).default(18),
    priceIncludesTax: z.boolean().default(true),
    countryOfOrigin: z.string().trim().min(2).max(80).default('IN'),
    manufacturerName: nullableText(240),
    manufacturerAddress: nullableText(1_000),
    packerName: nullableText(240),
    importerName: nullableText(240),
    netQuantity: optionalMoney,
    unitOfMeasure: nullableText(40),
    unitSalePrice: optionalMoney,
    consumerCareEmail: nullableText(254),
    consumerCarePhone: nullableText(32),
    bisRegistrationNo: nullableText(60),
    warrantyMonths: optionalInt(0, 240),
    warrantyType: warrantyTypeSchema.default('NONE'),
    isReturnable: z.boolean().default(true),
    returnWindowDays: optionalInt(0, 365),
    replacementAllowed: z.boolean().default(true),
    assemblyRequired: z.boolean().default(false),
    installationRequired: z.boolean().default(false),
    isFragile: z.boolean().default(false),
    isHeavy: z.boolean().default(false),
    shippingClass: shippingClassSchema.default('STANDARD'),
    metaTitle: nullableText(120),
    metaDescription: nullableText(320),
    searchKeywords: nullableText(1_000),
    variants: z.array(variantInputSchema).min(1, 'Add at least one variant.').max(200),
    images: z.array(productImageInputSchema).max(50).optional(),
    specifications: z.array(specificationInputSchema).max(300).optional(),
    attributeValues: z.array(productAttributeValueInputSchema).max(100).optional(),
  })
  .strict()

export const productUpdateSchema = productInputSchema.omit({ variants: true }).partial()

export const productListQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'ALL']).default('ALL'),
    categoryId: z.string().trim().min(1).max(64).optional(),
    brandId: z.string().trim().min(1).max(64).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

export const productPriceInputSchema = z
  .object({
    price: money,
    mrp: money,
    reason: z.string().trim().max(240).optional(),
  })
  .strict()
  .refine((value) => value.mrp >= value.price, {
    path: ['mrp'],
    message: 'MRP must be greater than or equal to the selling price.',
  })

export const variantMatrixSchema = z
  .object({
    attributeCodes: z
      .array(z.string().trim().min(1).max(40))
      .min(1, 'Choose at least one variant axis.')
      .max(5),
    baseSku: z.string().trim().min(1).max(60).optional(),
    namePrefix: z.string().trim().max(160).optional(),
  })
  .strict()

// ---------------------------------------------------------------------------
// Public search
// ---------------------------------------------------------------------------

export const catalogSortSchema = z.enum([
  'relevance',
  'newest',
  'price_asc',
  'price_desc',
  'rating',
  'popular',
  'discount',
])

export interface PublicCatalogQuery {
  q?: string
  category?: string
  brands: string[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  minDiscount?: number
  countryOfOrigin?: string
  attributes: Record<string, string[]>
  sort: z.infer<typeof catalogSortSchema>
  page: number
  limit: number
}

const scalarParam = (value: string | null): string | undefined => {
  if (value === null) return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

const numberParam = (value: string | null): number | undefined => {
  const raw = scalarParam(value)
  if (raw === undefined) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

const booleanParam = (value: string | null): boolean | undefined => {
  const raw = scalarParam(value)
  if (raw === undefined) return undefined
  if (['true', '1', 'yes'].includes(raw.toLowerCase())) return true
  if (['false', '0', 'no'].includes(raw.toLowerCase())) return false
  return undefined
}

/**
 * Parse a public catalogue query string. Attribute filters use the documented
 * `attr.<code>=value` convention and may repeat.
 */
export function parsePublicCatalogQuery(params: URLSearchParams): PublicCatalogQuery {
  const attributes: Record<string, string[]> = {}
  for (const [key, value] of params.entries()) {
    if (!key.startsWith('attr.')) continue
    const code = key.slice(5).trim()
    if (!code) continue
    const list = (attributes[code] ??= [])
    if (value.trim() !== '' && !list.includes(value.trim())) list.push(value.trim())
  }

  const brands = params.getAll('brand').flatMap((value) => value.split(',')).filter(Boolean)

  const sort = catalogSortSchema.safeParse(scalarParam(params.get('sort')))
  const page = Math.max(1, Math.floor(numberParam(params.get('page')) ?? 1))
  const limit = Math.min(100, Math.max(1, Math.floor(numberParam(params.get('limit')) ?? 24)))

  return {
    q: scalarParam(params.get('q')),
    category: scalarParam(params.get('category')),
    brands: [...new Set(brands)],
    minPrice: numberParam(params.get('minPrice')),
    maxPrice: numberParam(params.get('maxPrice')),
    minRating: numberParam(params.get('rating')),
    inStock: booleanParam(params.get('inStock')),
    minDiscount: numberParam(params.get('discount')),
    countryOfOrigin: scalarParam(params.get('countryOfOrigin')),
    attributes,
    sort: sort.success ? sort.data : 'relevance',
    page,
    limit,
  }
}

export type CategoryInput = z.infer<typeof categoryInputSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type BrandInput = z.infer<typeof brandInputSchema>
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>
export type AttributeInput = z.infer<typeof attributeInputSchema>
export type AttributeUpdateInput = z.infer<typeof attributeUpdateSchema>
export type ProductInput = z.infer<typeof productInputSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type VariantInput = z.infer<typeof variantInputSchema>
export type VariantUpdateInput = z.infer<typeof variantUpdateSchema>
export type ProductImageInput = z.infer<typeof productImageInputSchema>
export type SpecificationInput = z.infer<typeof specificationInputSchema>
export type ProductAttributeValueInput = z.infer<typeof productAttributeValueInputSchema>
export type ProductPriceInput = z.infer<typeof productPriceInputSchema>
