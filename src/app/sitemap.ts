import type { MetadataRoute } from 'next'

import { getEnv } from '@/lib/env'

/**
 * Static shell sitemap. Catalogue, CMS and blog entries are appended by the
 * SEO module once those repositories exist, and only published documents are
 * included.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getEnv().APP_URL
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
