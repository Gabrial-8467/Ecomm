const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'account',
  'cart',
  'checkout',
  'search',
  'wishlist',
  'compare',
  'orders',
  'login',
  'register',
  'sitemap.xml',
  'robots.txt',
])

/**
 * URL-safe slug generation. Deterministic and idempotent.
 * The caller is responsible for uniqueness checks against the database.
 */
export function slugify(input: string, fallback = 'item'): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    .replace(/-+$/g, '')

  if (!base) return fallback
  return RESERVED_SLUGS.has(base) ? `${base}-1` : base
}

/** Append an incrementing suffix when a slug is taken. */
export function slugWithSuffix(base: string, attempt: number): string {
  if (attempt <= 0) return base
  return `${base}-${attempt + 1}`
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug)
}
