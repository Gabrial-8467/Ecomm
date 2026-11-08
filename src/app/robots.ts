import type { MetadataRoute } from 'next'

import { getEnv } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getEnv().APP_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account', '/admin', '/api', '/cart', '/checkout', '/orders'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
