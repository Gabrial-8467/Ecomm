import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbJsonLd, listPublicBrands } from '@/modules/catalog'

export const metadata: Metadata = {
  title: 'Brands',
  description:
    'Browse the brands stocked by CasaCircuit, with published product counts and links to their catalogues.',
  alternates: { canonical: '/brands' },
}

export const dynamic = 'force-dynamic'

export default async function BrandsPage() {
  const brands = await listPublicBrands()

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Catalogue</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Brands we stock
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Brand pages list only published products. Counts come from the live catalogue, not
          marketing copy.
        </p>
      </header>

      {brands.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
          Brand listings are being prepared.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                href={`/brands/${brand.slug}`}
                className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/60"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-lg font-semibold">{brand.name}</span>
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </span>
                {brand.description ? (
                  <span className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {brand.description}
                  </span>
                ) : null}
                <span className="mt-auto pt-4 text-xs text-muted-foreground">
                  {brand._count.products} product{brand._count.products === 1 ? '' : 's'}
                  {brand.isFeatured ? ' · Featured brand' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Brands', path: '/brands' },
        ])}
      />
    </div>
  )
}
