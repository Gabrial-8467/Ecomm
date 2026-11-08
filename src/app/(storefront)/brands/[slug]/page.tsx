import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { ProductGrid } from '@/components/catalog/product-grid'
import { JsonLd } from '@/components/seo/json-ld'
import { catalogResetHref, searchParamsFromRecord, type PageSearchParams } from '@/lib/catalog-url'
import {
  breadcrumbJsonLd,
  findBrandBySlug,
  itemListJsonLd,
  parsePublicCatalogQuery,
  searchCatalog,
} from '@/modules/catalog'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<PageSearchParams>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const brand = await findBrandBySlug(slug)
  if (!brand || !brand.isActive) {
    return { title: 'Brand not found', robots: { index: false, follow: false } }
  }
  const title = brand.seoTitle ?? `${brand.name} at CasaCircuit`
  const description =
    brand.seoDescription ??
    brand.description ??
    `Shop ${brand.name} products at CasaCircuit with GST-inclusive prices and documented specifications.`
  return {
    title,
    description,
    alternates: { canonical: `/brands/${brand.slug}` },
    openGraph: { title, description, url: `/brands/${brand.slug}` },
  }
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const input = await searchParams
  const query = parsePublicCatalogQuery(searchParamsFromRecord(input))
  const brand = await findBrandBySlug(slug)
  if (!brand || !brand.isActive) notFound()

  const results = await searchCatalog({ ...query, brands: [brand.slug] })

  return (
    <div className="container-page py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden="true" />
            <Link href="/brands" className="hover:text-foreground">
              Brands
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden="true" />
            <span aria-current="page">{brand.name}</span>
          </li>
        </ol>
      </nav>

      <header className="mt-4 border-b border-border pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Brand</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {brand.name}
        </h1>
        {brand.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {brand.description}
          </p>
        ) : null}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-semibold">Filters</h2>
            <div className="mt-4">
              <CatalogFilters
                action={`/brands/${brand.slug}`}
                facets={results.facets}
                query={query}
              />
            </div>
          </div>
        </aside>

        <section aria-label={`${brand.name} products`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>
              {results.total} product{results.total === 1 ? '' : 's'}
            </p>
            <p>
              Page {results.page} of {results.totalPages}
            </p>
          </div>

          <ProductGrid
            products={results.items}
            resetHref={catalogResetHref(`/brands/${brand.slug}`, query)}
          />

          <CatalogPagination
            basePath={`/brands/${brand.slug}`}
            query={query}
            totalPages={results.totalPages}
          />

          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Brands', path: '/brands' },
              { name: brand.name, path: `/brands/${brand.slug}` },
            ])}
          />
          {results.items.length > 0 ? (
            <JsonLd
              data={itemListJsonLd(
                brand.name,
                results.items.map((product) => ({
                  name: product.name,
                  url: `/products/${product.slug}`,
                  image: product.image?.url ?? null,
                })),
              )}
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}
