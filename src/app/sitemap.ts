import type { MetadataRoute } from 'next'

import { getEnv } from '@/lib/env'
import {
  listCategories,
  listPublicBrands,
  listPublishedProductsForSitemap,
} from '@/modules/catalog'

export const dynamic = 'force-dynamic'

/**
 * Only published, non-archived catalogue documents are included. Inactive
 * categories and draft products stay out of the sitemap until they are live.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getEnv().APP_URL
  const now = new Date()

  const [categories, brands, products] = await Promise.all([
    listCategories(),
    listPublicBrands(),
    listPublishedProductsForSitemap(),
  ])

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/brands`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ]

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((category) => category.isActive)
    .map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'weekly',
      priority: category.level === 0 ? 0.8 : 0.7,
    }))

  const brandEntries: MetadataRoute.Sitemap = brands
    .filter((brand) => brand.isActive)
    .map((brand) => ({
      url: `${baseUrl}/brands/${brand.slug}`,
      lastModified: brand.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticEntries, ...categoryEntries, ...brandEntries, ...productEntries]
}
