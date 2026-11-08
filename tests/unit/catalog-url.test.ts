import { describe, expect, it } from 'vitest'

import {
  catalogHref,
  catalogResetHref,
  catalogSearchParams,
  searchParamsFromRecord,
  type CatalogQueryState,
} from '@/lib/catalog-url'
import { parsePublicCatalogQuery } from '@/modules/catalog/catalog.schema'

describe('parsePublicCatalogQuery', () => {
  it('parses repeated attribute and brand filters with documented defaults', () => {
    const query = parsePublicCatalogQuery(
      new URLSearchParams(
        'q=sofa&attr.color=Black&attr.color=Beige&brand=a&brand=b,c&minPrice=1000&maxPrice=5000&rating=4&inStock=yes&discount=10&sort=price_asc&page=2&limit=48',
      ),
    )

    expect(query).toEqual({
      q: 'sofa',
      category: undefined,
      brands: ['a', 'b', 'c'],
      minPrice: 1000,
      maxPrice: 5000,
      minRating: 4,
      inStock: true,
      minDiscount: 10,
      countryOfOrigin: undefined,
      attributes: { color: ['Black', 'Beige'] },
      sort: 'price_asc',
      page: 2,
      limit: 48,
    })
  })

  it('falls back on invalid sort, clamps pagination and ignores empty values', () => {
    const query = parsePublicCatalogQuery(
      new URLSearchParams('sort=drop_table&page=-3&limit=10000&attr.=x&attr.color='),
    )
    expect(query.sort).toBe('relevance')
    expect(query.page).toBe(1)
    expect(query.limit).toBe(100)
    expect(query.attributes).toEqual({ color: [] })
  })
})

describe('catalog URL helpers', () => {
  const query: CatalogQueryState = {
    q: 'sofa',
    brands: ['a'],
    minPrice: 1000,
    attributes: { color: ['Black'], material: ['Fabric'] },
    sort: 'price_asc',
    page: 2,
    limit: 12,
  }

  it('serialises filters and omits default values', () => {
    expect(catalogSearchParams(query).toString()).toBe(
      'q=sofa&brand=a&minPrice=1000&attr.color=Black&attr.material=Fabric&sort=price_asc&page=2&limit=12',
    )
    expect(
      catalogSearchParams({
        brands: [],
        attributes: {},
        sort: 'relevance',
        page: 1,
        limit: 24,
      }).toString(),
    ).toBe('')
  })

  it('preserves active filters when changing page and can reset them', () => {
    const href = catalogHref('/products', query, { page: 3 })
    expect(href).toContain('page=3')
    expect(href).toContain('attr.color=Black')
    expect(href).toContain('sort=price_asc')
    expect(catalogResetHref('/products', query)).toBe('/products?q=sofa')
    expect(catalogResetHref('/categories/sofas', { ...query, q: undefined })).toBe(
      '/categories/sofas',
    )
  })

  it('converts App Router search params including repeated keys', () => {
    const params = searchParamsFromRecord({
      q: 'sofa',
      brand: ['a', 'b'],
      attr: undefined,
    })
    expect(params.toString()).toBe('q=sofa&brand=a&brand=b')
  })
})
