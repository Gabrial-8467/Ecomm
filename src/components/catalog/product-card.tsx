import { ImageIcon, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { WishlistButton } from '@/components/store/wishlist-button'
import type { productCardView } from '@/modules/catalog'

export type ProductCardData = ReturnType<typeof productCardView>

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatCatalogPrice(value: number): string {
  return money.format(value)
}

export function ProductCard({
  product,
  saved = false,
}: {
  product: ProductCardData
  saved?: boolean
}) {
  const { price } = product
  const hasRange = price.max > price.min
  const image = product.image

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary"
        aria-label={product.name}
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-8" aria-hidden="true" />
          </span>
        )}
        {price.discountPercent > 0 ? (
          <span className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-1 text-[0.6875rem] font-semibold text-accent-foreground">
            {price.discountPercent}% off
          </span>
        ) : null}
      </Link>

      <WishlistButton
        productId={product.id}
        saved={saved}
        iconOnly
        className="absolute top-3 right-3 z-10"
      />

      <div className="flex flex-1 flex-col p-4">
        {product.brand ? (
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {product.brand.name}
          </p>
        ) : (
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {product.category.name}
          </p>
        )}

        <h3 className="mt-1.5 text-sm leading-5 font-medium">
          <Link href={`/products/${product.slug}`} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>

        {product.shortDescription ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-semibold tabular-nums">
              {hasRange ? `From ${money.format(price.min)}` : money.format(price.min)}
            </span>
            {price.mrp > price.min ? (
              <span className="text-xs text-muted-foreground tabular-nums line-through">
                {money.format(price.mrp)}
              </span>
            ) : null}
          </p>

          {product.rating.reviews > 0 ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
              <span className="font-medium text-foreground">
                {product.rating.average.toFixed(1)}
              </span>
              <span>
                ({product.rating.count} rating{product.rating.count === 1 ? '' : 's'},{' '}
                {product.rating.reviews} review{product.rating.reviews === 1 ? '' : 's'})
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
