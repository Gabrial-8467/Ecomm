/**
 * URL helpers for public catalogue pages.
 *
 * The public catalogue accepts a documented set of query parameters. These
 * helpers serialise the parsed state back into links and forms without
 * dropping active filters when the user changes page or sort order.
 */

export type PageSearchParams = Record<string, string | string[] | undefined>

/** Convert App Router `searchParams` into the URLSearchParams the parser expects. */
export function searchParamsFromRecord(input: PageSearchParams): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      params.append(key, value)
    } else if (Array.isArray(value)) {
      for (const item of value) params.append(key, item)
    }
  }
  return params
}

export interface CatalogQueryState {
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
  sort: string
  page: number
  limit: number
}

export type CatalogQueryOverrides = Partial<Omit<CatalogQueryState, 'attributes'>> & {
  attributes?: Record<string, string[]>
  page?: number
}

export function catalogSearchParams(
  query: CatalogQueryState,
  overrides: CatalogQueryOverrides = {},
): URLSearchParams {
  const merged: CatalogQueryState = {
    ...query,
    ...(overrides.q !== undefined ? { q: overrides.q } : {}),
    ...(overrides.category !== undefined ? { category: overrides.category } : {}),
    ...(overrides.brands !== undefined ? { brands: overrides.brands } : {}),
    ...(overrides.minPrice !== undefined ? { minPrice: overrides.minPrice } : {}),
    ...(overrides.maxPrice !== undefined ? { maxPrice: overrides.maxPrice } : {}),
    ...(overrides.minRating !== undefined ? { minRating: overrides.minRating } : {}),
    ...(overrides.inStock !== undefined ? { inStock: overrides.inStock } : {}),
    ...(overrides.minDiscount !== undefined ? { minDiscount: overrides.minDiscount } : {}),
    ...(overrides.countryOfOrigin !== undefined
      ? { countryOfOrigin: overrides.countryOfOrigin }
      : {}),
    ...(overrides.sort !== undefined ? { sort: overrides.sort } : {}),
    ...(overrides.page !== undefined ? { page: overrides.page } : {}),
    ...(overrides.limit !== undefined ? { limit: overrides.limit } : {}),
    attributes: overrides.attributes ?? query.attributes,
  }
  const params = new URLSearchParams()

  if (merged.q) params.set('q', merged.q)
  if (merged.category) params.set('category', merged.category)
  for (const brand of merged.brands ?? []) params.append('brand', brand)
  if (merged.minPrice !== undefined) params.set('minPrice', String(merged.minPrice))
  if (merged.maxPrice !== undefined) params.set('maxPrice', String(merged.maxPrice))
  if (merged.minRating !== undefined) params.set('rating', String(merged.minRating))
  if (merged.inStock) params.set('inStock', 'true')
  if (merged.minDiscount !== undefined) params.set('discount', String(merged.minDiscount))
  if (merged.countryOfOrigin) params.set('countryOfOrigin', merged.countryOfOrigin)
  for (const [code, values] of Object.entries(merged.attributes ?? {})) {
    for (const value of values) params.append(`attr.${code}`, value)
  }
  if (merged.sort && merged.sort !== 'relevance') params.set('sort', merged.sort)
  if (merged.page > 1) params.set('page', String(merged.page))
  if (merged.limit !== 24) params.set('limit', String(merged.limit))

  return params
}

export function catalogHref(
  path: string,
  query: CatalogQueryState,
  overrides: CatalogQueryOverrides = {},
): string {
  const params = catalogSearchParams(query, overrides)
  const search = params.toString()
  return search ? `${path}?${search}` : path
}

/** Reset filters but keep the free-text query and a safe sort order. */
export function catalogResetHref(path: string, query: CatalogQueryState): string {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  const search = params.toString()
  return search ? `${path}?${search}` : path
}
