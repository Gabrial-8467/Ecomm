import { PackageSearch } from 'lucide-react'
import Link from 'next/link'

import { ProductCard, type ProductCardData } from '@/components/catalog/product-card'
import { getWishlistProductIds } from '@/modules/wishlist/wishlist.service'

export async function ProductGrid({
  products,
  emptyTitle = 'No products match these filters',
  emptyBody = 'Try removing a filter or searching for a broader term.',
  resetHref,
}: {
  products: ProductCardData[]
  emptyTitle?: string
  emptyBody?: string
  resetHref?: string
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
        <PackageSearch className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-semibold">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{emptyBody}</p>
        {resetHref ? (
          <Link
            href={resetHref}
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    )
  }

  const savedIds = await getWishlistProductIds()

  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} saved={savedIds.has(product.id)} />
        </li>
      ))}
    </ul>
  )
}
