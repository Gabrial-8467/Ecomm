import { beforeEach, describe, expect, it } from 'vitest'

import { UnprocessableError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import {
  changeVariantPrice,
  generateVariantMatrixForProduct,
  getCategoryPage,
  getCategoryTree,
  publishProduct,
  searchCatalog,
  updateCategory,
} from '@/modules/catalog'

import {
  createAttribute,
  createBrand,
  createCategory,
  createProductFixture,
  createSeller,
} from './catalog-factories'
import { resetDatabase } from './factories'

const ACTOR = 'test-actor-catalog'

beforeEach(async () => {
  await resetDatabase()
})

describe('category tree and reparenting', () => {
  it('builds a sorted tree and rewrites descendant paths when a node moves', async () => {
    const furniture = await createCategory({ name: 'Furniture', slug: 'furniture', sortOrder: 0 })
    const seating = await createCategory({
      name: 'Seating',
      slug: 'seating',
      parent: furniture,
      sortOrder: 1,
    })
    const sofas = await createCategory({
      name: 'Sofas',
      slug: 'sofas',
      parent: seating,
      sortOrder: 0,
    })
    const electronics = await createCategory({
      name: 'Electronics',
      slug: 'electronics',
      sortOrder: 1,
    })

    const tree = await getCategoryTree({ activeOnly: true })
    expect(tree.map((node) => node.slug)).toEqual(['furniture', 'electronics'])
    expect(tree[0]!.children[0]!.slug).toBe('seating')
    expect(tree[0]!.children[0]!.children[0]!.slug).toBe('sofas')

    await updateCategory(seating.id, { parentId: electronics.id }, ACTOR)

    const [moved, descendant] = await Promise.all([
      prisma.category.findUniqueOrThrow({ where: { id: seating.id } }),
      prisma.category.findUniqueOrThrow({ where: { id: sofas.id } }),
    ])
    expect(moved.parentId).toBe(electronics.id)
    expect(moved.path).toBe('/electronics/seating')
    expect(moved.level).toBe(1)
    expect(descendant.path).toBe('/electronics/seating/sofas')
    expect(descendant.level).toBe(2)

    await expect(updateCategory(electronics.id, { parentId: sofas.id }, ACTOR)).rejects.toThrow(
      /descendant/i,
    )
  })
})

describe('variant matrix generation', () => {
  it('creates one variant per combination and is idempotent', async () => {
    const seller = await createSeller()
    const category = await createCategory({ name: 'Sofas', slug: 'sofas' })
    const product = await createProductFixture({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Modular sofa',
    })
    const colour = await createAttribute({
      code: 'color',
      name: 'Colour',
      isVariantAxis: true,
      options: ['Black', 'Beige'],
    })
    const size = await createAttribute({
      code: 'size',
      name: 'Size',
      isVariantAxis: true,
      options: ['2-seat', '3-seat'],
    })

    const first = await generateVariantMatrixForProduct(
      product.id,
      { attributeCodes: [colour.code, size.code], baseSku: 'SOFA' },
      ACTOR,
    )
    expect(first.created).toBe(4)

    const variants = await prisma.productVariant.findMany({
      where: { productId: product.id },
      include: { attributeValues: true },
      orderBy: { sku: 'asc' },
    })
    expect(variants).toHaveLength(5)
    const generated = variants.filter((variant) => !variant.isDefault)
    expect(generated.every((variant) => variant.attributeValues.length === 2)).toBe(true)
    expect(new Set(generated.map((variant) => variant.sku)).size).toBe(4)

    const second = await generateVariantMatrixForProduct(
      product.id,
      { attributeCodes: [colour.code, size.code], baseSku: 'SOFA' },
      ACTOR,
    )
    expect(second.created).toBe(0)
  })
})

describe('catalogue filtering and facets', () => {
  it('filters by attribute and brand while preserving facet counts', async () => {
    const seller = await createSeller()
    const furniture = await createCategory({ name: 'Furniture', slug: 'furniture' })
    const seating = await createCategory({
      name: 'Seating',
      slug: 'seating',
      parent: furniture,
    })
    const brandA = await createBrand('Brand A')
    const brandB = await createBrand('Brand B')
    const colour = await createAttribute({
      code: 'color',
      name: 'Colour',
      options: ['Black', 'White'],
    })
    const black = colour.options.find((option) => option.value === 'Black')!
    const white = colour.options.find((option) => option.value === 'White')!

    const blackSofa = await createProductFixture({
      sellerId: seller.id,
      categoryId: seating.id,
      brandId: brandA.id,
      name: 'Black sofa',
      slug: 'black-sofa',
      price: '1000.00',
      mrp: '1500.00',
      status: 'ACTIVE',
      publishedAt: new Date(),
      attributeValues: [{ attributeId: colour.id, optionId: black.id }],
    })
    await createProductFixture({
      sellerId: seller.id,
      categoryId: furniture.id,
      brandId: brandB.id,
      name: 'White chair',
      slug: 'white-chair',
      price: '2000.00',
      mrp: '2000.00',
      status: 'ACTIVE',
      publishedAt: new Date(),
      attributeValues: [{ attributeId: colour.id, optionId: white.id }],
    })
    await createProductFixture({
      sellerId: seller.id,
      categoryId: seating.id,
      brandId: brandA.id,
      name: 'Draft sofa',
      slug: 'draft-sofa',
      status: 'DRAFT',
      attributeValues: [{ attributeId: colour.id, optionId: black.id }],
    })

    const baseQuery = {
      brands: [] as string[],
      attributes: {} as Record<string, string[]>,
      sort: 'relevance' as const,
      page: 1,
      limit: 24,
    }

    const filtered = await searchCatalog({
      ...baseQuery,
      attributes: { [colour.code]: ['Black'] },
    })
    expect(filtered.total).toBe(1)
    expect(filtered.items[0]!.slug).toBe(blackSofa.slug)
    expect(filtered.facets.brands.map((brand) => brand.slug).sort()).toEqual(
      [brandA.slug, brandB.slug].sort(),
    )
    expect(
      filtered.facets.attributes
        .find((facet) => facet.code === colour.code)!
        .values.map((value) => value.value)
        .sort(),
    ).toEqual(['Black', 'White'])

    const brandFiltered = await searchCatalog({ ...baseQuery, brands: [brandB.slug] })
    expect(brandFiltered.total).toBe(1)
    expect(brandFiltered.items[0]!.slug).toBe('white-chair')

    const priceFiltered = await searchCatalog({ ...baseQuery, maxPrice: 1500 })
    expect(priceFiltered.items.map((item) => item.slug)).toEqual([blackSofa.slug])

    const byCategory = await getCategoryPage(seating.slug, baseQuery)
    expect(byCategory).not.toBeNull()
    expect(byCategory!.breadcrumb.map((entry) => entry.slug)).toEqual([
      furniture.slug,
      seating.slug,
    ])
    expect(byCategory!.items.map((item) => item.slug)).toEqual(['black-sofa'])

    const searched = await searchCatalog({ ...baseQuery, q: 'black sofa' })
    expect(searched.items.map((item) => item.slug)).toEqual(['black-sofa'])
  })
})

describe('price history', () => {
  it('closes the previous price window and records the new price', async () => {
    const seller = await createSeller()
    const category = await createCategory({ name: 'Sofas', slug: 'sofas' })
    const product = await createProductFixture({
      sellerId: seller.id,
      categoryId: category.id,
      price: '1000.00',
      mrp: '1500.00',
    })
    const variant = product.variants[0]!
    await prisma.productPriceHistory.create({
      data: {
        variantId: variant.id,
        price: '1000.00',
        mrp: '1500.00',
        effectiveFrom: new Date(Date.now() - 60_000),
        reason: 'Initial price',
        changedByUserId: ACTOR,
      },
    })

    const updated = await changeVariantPrice(
      variant.id,
      { price: 900, mrp: 1500, reason: 'Festive promotion' },
      ACTOR,
    )
    expect(updated.price.toString()).toBe('900')
    expect(updated.priceHistory).toHaveLength(2)

    const history = await prisma.productPriceHistory.findMany({
      where: { variantId: variant.id },
      orderBy: { effectiveFrom: 'asc' },
    })
    expect(history).toHaveLength(2)
    expect(history[0]!.price.toString()).toBe('1000')
    expect(history[0]!.effectiveTo).not.toBeNull()
    expect(history[1]!.price.toString()).toBe('900')
    expect(history[1]!.effectiveTo).toBeNull()
    expect(history[1]!.reason).toBe('Festive promotion')
  })
})

describe('publishing validation', () => {
  it('blocks publishing until declarations, image and seller identity are complete', async () => {
    const seller = await createSeller({ registeredAddress: null, customerCareEmail: null })
    const category = await createCategory({ name: 'Sofas', slug: 'sofas' })
    const colour = await createAttribute({
      code: 'color',
      name: 'Colour',
      options: ['Black', 'White'],
    })
    await prisma.categoryAttribute.create({
      data: {
        categoryId: category.id,
        attributeId: colour.id,
        isRequired: true,
        isFilterable: true,
        sortOrder: 0,
      },
    })
    const product = await createProductFixture({
      sellerId: seller.id,
      categoryId: category.id,
      completeDeclarations: false,
      image: false,
    })

    let error: unknown
    try {
      await publishProduct(product.id, ACTOR)
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(UnprocessableError)
    const fields = (error as UnprocessableError).details as { field: string }[]
    expect(fields.map((issue) => issue.field)).toEqual(
      expect.arrayContaining([
        'hsnCode',
        'manufacturerName',
        'packerName',
        'netQuantity',
        'unitOfMeasure',
        'unitSalePrice',
        'consumerCareEmail',
        'images',
        'seller.registeredAddress',
        'seller.customerCareEmail',
        'attributeValues.color',
      ]),
    )

    const stillDraft = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(stillDraft.status).toBe('DRAFT')

    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        registeredAddress: {
          line1: '1 Test Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        customerCareEmail: 'care@example.com',
      },
    })
    await prisma.product.update({
      where: { id: product.id },
      data: {
        hsnCode: '94036000',
        gstRate: '18.00',
        priceIncludesTax: true,
        countryOfOrigin: 'IN',
        manufacturerName: 'Test Manufacturer',
        manufacturerAddress: '2 Industrial Estate, Bengaluru',
        packerName: 'Test Packer',
        netQuantity: '1.000',
        unitOfMeasure: 'piece',
        unitSalePrice: '1000.00',
        consumerCareEmail: 'care@example.com',
        warrantyType: 'MANUFACTURER',
        warrantyMonths: 12,
        isReturnable: true,
        returnWindowDays: 7,
        images: {
          create: [
            {
              url: 'https://cdn.example.com/sofa.jpg',
              alt: 'Black sofa product photograph',
              isPrimary: true,
            },
          ],
        },
      },
    })

    await expect(publishProduct(product.id, ACTOR)).rejects.toThrow(UnprocessableError)

    await prisma.productAttributeValue.create({
      data: {
        productId: product.id,
        attributeId: colour.id,
        optionId: colour.options.find((option) => option.value === 'Black')!.id,
      },
    })

    const published = await publishProduct(product.id, ACTOR)
    expect(published.status).toBe('ACTIVE')
    expect(published.publishedAt).not.toBeNull()
  })
})

describe('public catalogue API', () => {
  it('returns only published products and strips cost fields', async () => {
    const seller = await createSeller()
    const category = await createCategory({ name: 'Sofas', slug: 'sofas' })
    const product = await createProductFixture({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Public sofa',
      slug: 'public-sofa',
      status: 'ACTIVE',
      publishedAt: new Date(),
    })
    await prisma.productVariant.update({
      where: { id: product.variants[0]!.id },
      data: { costPrice: '700.00' },
    })
    await createProductFixture({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Draft sofa',
      slug: 'draft-sofa',
      status: 'DRAFT',
    })

    const { GET: listProducts } = await import('@/app/api/v1/products/route')
    const listResponse = await listProducts(
      new Request('http://localhost/api/v1/products?limit=10'),
    )
    expect(listResponse.status).toBe(200)
    const listBody = (await listResponse.json()) as {
      items: { slug: string }[]
      pagination: { total: number }
    }
    expect(listBody.items.map((item) => item.slug)).toEqual(['public-sofa'])
    expect(listBody.pagination.total).toBe(1)

    const { GET: getProduct } = await import('@/app/api/v1/products/[slug]/route')
    const detailResponse = await getProduct(
      new Request('http://localhost/api/v1/products/public-sofa'),
      { params: Promise.resolve({ slug: 'public-sofa' }) },
    )
    expect(detailResponse.status).toBe(200)
    const detailBody = (await detailResponse.json()) as {
      product: Record<string, unknown> & { variants: Record<string, unknown>[] }
    }
    expect(detailBody.product.slug).toBe('public-sofa')
    expect(detailBody.product).not.toHaveProperty('costPrice')
    expect(detailBody.product.variants[0]).not.toHaveProperty('costPrice')
    const etag = detailResponse.headers.get('etag')
    expect(etag).toBeTruthy()

    const cached = await getProduct(
      new Request('http://localhost/api/v1/products/public-sofa', {
        headers: { 'if-none-match': etag! },
      }),
      { params: Promise.resolve({ slug: 'public-sofa' }) },
    )
    expect(cached.status).toBe(304)
  })
})
