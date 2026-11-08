import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { productCardSelect, type ProductCard, findCategoryBySlug } from './catalog.repository'
import { productCardView } from './catalog.presenter'
import type { PublicCatalogQuery } from './catalog.schema'

let trigramPromise: Promise<boolean> | null = null

async function hasTrigramExtension(): Promise<boolean> {
  trigramPromise ??= prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS "exists"
    `
    .then((rows) => rows[0]?.exists === true)
    .catch(() => false)
  return trigramPromise
}

const PRICE_LATERAL = Prisma.sql`
  LEFT JOIN LATERAL (
    SELECT
      MIN(v."price") AS min_price,
      MAX(v."price") AS max_price,
      COALESCE(MAX(CASE WHEN v."mrp" > 0 THEN (v."mrp" - v."price") / v."mrp" * 100 ELSE 0 END), 0) AS max_discount
    FROM "ProductVariant" v
    WHERE v."productId" = p."id" AND v."isActive" = true
  ) pv ON true
`

function baseConditions(query: PublicCatalogQuery, options: { ignoreAttributes?: boolean } = {}) {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p."status" = 'ACTIVE'`,
    Prisma.sql`p."archivedAt" IS NULL`,
    Prisma.sql`c."isActive" = true`,
    Prisma.sql`c."archivedAt" IS NULL`,
  ]

  if (query.category) {
    const path = query.category.startsWith('/') ? query.category : `/${query.category}`
    conditions.push(Prisma.sql`(c."path" = ${path} OR c."path" LIKE ${`${path}/%`})`)
  }
  if (query.brands.length > 0) {
    conditions.push(Prisma.sql`b."slug" = ANY(${query.brands}::text[])`)
  }
  if (query.minPrice !== undefined) {
    conditions.push(Prisma.sql`pv.max_price >= ${query.minPrice}`)
  }
  if (query.maxPrice !== undefined) {
    conditions.push(Prisma.sql`pv.min_price <= ${query.maxPrice}`)
  }
  if (query.minRating !== undefined) {
    conditions.push(Prisma.sql`p."ratingAvg" >= ${query.minRating}`)
  }
  if (query.minDiscount !== undefined && query.minDiscount > 0) {
    conditions.push(Prisma.sql`pv.max_discount >= ${query.minDiscount}`)
  }
  if (query.countryOfOrigin) {
    conditions.push(Prisma.sql`p."countryOfOrigin" = ${query.countryOfOrigin}`)
  }
  if (query.inStock) {
    conditions.push(Prisma.sql`
      EXISTS (
        SELECT 1 FROM "Inventory" i
        JOIN "ProductVariant" iv ON iv."id" = i."variantId"
        WHERE iv."productId" = p."id" AND iv."isActive" = true AND i."onHand" > i."reserved"
      )
    `)
  }

  if (!options.ignoreAttributes) {
    for (const [code, values] of Object.entries(query.attributes)) {
      if (values.length === 0) continue
      conditions.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "ProductAttributeValue" pav
          JOIN "AttributeDefinition" ad ON ad."id" = pav."attributeId"
          LEFT JOIN "AttributeOption" ao ON ao."id" = pav."optionId"
          WHERE pav."productId" = p."id"
            AND ad."code" = ${code}
            AND (ao."value" = ANY(${values}::text[]) OR pav."valueText" = ANY(${values}::text[]))
        )
      `)
    }
  }

  return conditions
}

function whereClause(conditions: Prisma.Sql[]): Prisma.Sql {
  return Prisma.join(conditions, ' AND ')
}

interface SearchRow {
  id: string
}

export interface CatalogFacets {
  brands: { slug: string; name: string; count: number }[]
  attributes: {
    code: string
    name: string
    unit: string | null
    values: { value: string; label: string; count: number }[]
  }[]
  price: { min: number; max: number } | null
}

export interface CatalogSearchResult {
  items: ReturnType<typeof productCardView>[]
  total: number
  page: number
  limit: number
  totalPages: number
  facets: CatalogFacets
}

async function fetchFacets(query: PublicCatalogQuery): Promise<CatalogFacets> {
  const conditions = baseConditions(query, { ignoreAttributes: true })

  const [brands, attributeRows, priceRows] = await Promise.all([
    prisma.$queryRaw<{ slug: string; name: string; count: number }[]>`
      SELECT b."slug", b."name", COUNT(DISTINCT p."id")::int AS count
      FROM "Product" p
      JOIN "Category" c ON c."id" = p."categoryId"
      JOIN "Brand" b ON b."id" = p."brandId"
      ${PRICE_LATERAL}
      WHERE ${whereClause(conditions)}
      GROUP BY b."slug", b."name"
      ORDER BY count DESC, b."name" ASC
      LIMIT 50
    `,
    prisma.$queryRaw<
      {
        code: string
        name: string
        unit: string | null
        value: string | null
        label: string | null
        count: number
      }[]
    >`
      SELECT ad."code", ad."name", ad."unit",
             ao."value", COALESCE(ao."label", pav."valueText") AS label,
             COUNT(DISTINCT p."id")::int AS count
      FROM "Product" p
      JOIN "Category" c ON c."id" = p."categoryId"
      LEFT JOIN "Brand" b ON b."id" = p."brandId"
      ${PRICE_LATERAL}
      JOIN "ProductAttributeValue" pav ON pav."productId" = p."id"
      JOIN "AttributeDefinition" ad ON ad."id" = pav."attributeId"
      LEFT JOIN "AttributeOption" ao ON ao."id" = pav."optionId"
      WHERE ${whereClause(conditions)}
        AND ad."isFilterable" = true
        AND ad."isActive" = true
        AND (ao."value" IS NOT NULL OR pav."valueText" IS NOT NULL)
      GROUP BY ad."code", ad."name", ad."unit", ad."sortOrder", ao."value", ao."label", pav."valueText"
      ORDER BY ad."sortOrder" ASC, ad."name" ASC, count DESC
      LIMIT 300
    `,
    prisma.$queryRaw<{ min: number | null; max: number | null }[]>`
      SELECT MIN(pv.min_price)::float8 AS min, MAX(pv.max_price)::float8 AS max
      FROM "Product" p
      JOIN "Category" c ON c."id" = p."categoryId"
      LEFT JOIN "Brand" b ON b."id" = p."brandId"
      ${PRICE_LATERAL}
      WHERE ${whereClause(conditions)}
    `,
  ])

  const grouped = new Map<
    string,
    {
      code: string
      name: string
      unit: string | null
      values: { value: string; label: string; count: number }[]
    }
  >()
  for (const row of attributeRows) {
    if (!row.value) continue
    const entry = grouped.get(row.code) ?? {
      code: row.code,
      name: row.name,
      unit: row.unit,
      values: [],
    }
    entry.values.push({ value: row.value, label: row.label ?? row.value, count: row.count })
    grouped.set(row.code, entry)
  }

  const price = priceRows[0]
  return {
    brands,
    attributes: [...grouped.values()],
    price:
      price && price.min !== null && price.max !== null
        ? { min: Number(price.min), max: Number(price.max) }
        : null,
  }
}

export async function searchCatalog(query: PublicCatalogQuery): Promise<CatalogSearchResult> {
  const conditions = baseConditions(query)
  const trigram = query.q ? await hasTrigramExtension() : false

  if (query.q) {
    const search = `%${query.q}%`
    conditions.push(
      trigram
        ? Prisma.sql`(
            p."searchVector" @@ websearch_to_tsquery('english', ${query.q})
            OR p."name" ILIKE ${search}
            OR p."name" % ${query.q}
            OR similarity(p."name", ${query.q}) > 0.2
          )`
        : Prisma.sql`(
            p."searchVector" @@ websearch_to_tsquery('english', ${query.q})
            OR p."name" ILIKE ${search}
          )`,
    )
  }

  const rank = query.q
    ? Prisma.sql`ts_rank_cd(p."searchVector", websearch_to_tsquery('english', ${query.q}))`
    : Prisma.sql`0::float4`

  let order: Prisma.Sql
  switch (query.sort) {
    case 'price_asc':
      order = Prisma.sql`pv.min_price ASC NULLS LAST, p."id" ASC`
      break
    case 'price_desc':
      order = Prisma.sql`pv.max_price DESC NULLS LAST, p."id" ASC`
      break
    case 'rating':
      order = Prisma.sql`p."ratingAvg" DESC, p."ratingCount" DESC, p."id" ASC`
      break
    case 'popular':
      order = Prisma.sql`p."soldCount" DESC, p."ratingAvg" DESC, p."id" ASC`
      break
    case 'newest':
      order = Prisma.sql`p."publishedAt" DESC NULLS LAST, p."id" ASC`
      break
    case 'discount':
      order = Prisma.sql`pv.max_discount DESC, p."ratingAvg" DESC, p."id" ASC`
      break
    default:
      order = Prisma.sql`${rank} DESC, p."soldCount" DESC, p."ratingAvg" DESC, p."publishedAt" DESC, p."id" ASC`
  }

  const where = whereClause(conditions)
  const offset = (query.page - 1) * query.limit

  const [rows, countRows, facets] = await Promise.all([
    prisma.$queryRaw<SearchRow[]>`
      SELECT p."id"
      FROM "Product" p
      JOIN "Category" c ON c."id" = p."categoryId"
      LEFT JOIN "Brand" b ON b."id" = p."brandId"
      ${PRICE_LATERAL}
      WHERE ${where}
      ORDER BY ${order}
      LIMIT ${query.limit} OFFSET ${offset}
    `,
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT p."id")::int AS count
      FROM "Product" p
      JOIN "Category" c ON c."id" = p."categoryId"
      LEFT JOIN "Brand" b ON b."id" = p."brandId"
      ${PRICE_LATERAL}
      WHERE ${where}
    `,
    fetchFacets(query),
  ])

  const ids = rows.map((row) => row.id)
  const products =
    ids.length === 0
      ? []
      : await prisma.product.findMany({
          where: { id: { in: ids } },
          select: productCardSelect,
        })
  const byId = new Map(products.map((product) => [product.id, product]))
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((product): product is ProductCard => product !== undefined)

  const total = countRows[0]?.count ?? 0
  return {
    items: ordered.map(productCardView),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    facets,
  }
}

export async function getCategoryPage(slug: string, baseQuery: PublicCatalogQuery) {
  const category = await findCategoryBySlug(slug)
  if (!category || !category.isActive || category.archivedAt) return null

  const query: PublicCatalogQuery = { ...baseQuery, category: category.path }
  const results = await searchCatalog(query)
  const ancestorSlugs = category.path.split('/').filter(Boolean)
  const ancestors = await prisma.category.findMany({
    where: { slug: { in: ancestorSlugs } },
    select: { name: true, slug: true, path: true },
    orderBy: { level: 'asc' },
  })
  const bySlug = new Map(ancestors.map((entry) => [entry.slug, entry]))
  const breadcrumb = ancestorSlugs
    .map((entry) => bySlug.get(entry))
    .filter((entry): entry is { name: string; slug: string; path: string } => entry !== undefined)

  return { category, breadcrumb, ...results }
}

export async function suggestCatalog(term: string, limit = 10) {
  const q = term.trim()
  if (q.length < 2) return { products: [], categories: [], brands: [] }

  const query: PublicCatalogQuery = {
    q,
    brands: [],
    attributes: {},
    sort: 'relevance',
    page: 1,
    limit: Math.min(5, limit),
  }
  const [products, categories, brands] = await Promise.all([
    searchCatalog(query),
    prisma.category.findMany({
      where: {
        isActive: true,
        archivedAt: null,
        name: { contains: q, mode: 'insensitive' },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      take: Math.min(3, limit),
      select: { name: true, slug: true, path: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      take: Math.min(3, limit),
      select: { name: true, slug: true },
    }),
  ])

  return {
    products: products.items,
    categories,
    brands,
  }
}

export async function getRelatedProducts(slug: string, limit = 8) {
  const product = await prisma.product.findFirst({
    where: { slug, status: 'ACTIVE', archivedAt: null },
    select: { id: true, categoryId: true, brandId: true },
  })
  if (!product) return []

  const rows = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      archivedAt: null,
      id: { not: product.id },
      OR: [
        { categoryId: product.categoryId },
        ...(product.brandId ? [{ brandId: product.brandId }] : []),
      ],
    },
    orderBy: [{ soldCount: 'desc' }, { ratingAvg: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
    select: productCardSelect,
  })
  return rows.map(productCardView)
}
