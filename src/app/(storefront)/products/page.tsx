import type { Metadata } from 'next'

import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { ProductGrid } from '@/components/catalog/product-grid'
import { JsonLd } from '@/components/seo/json-ld'
import { catalogResetHref, searchParamsFromRecord, type PageSearchParams } from '@/lib/catalog-url'
import { itemListJsonLd, parsePublicCatalogQuery, searchCatalog } from '@/modules/catalog'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<PageSearchParams> }

function queryTerm(input: PageSearchParams): string | null {
  const value = input.q
  const term = Array.isArray(value) ? value[0] : value
  const trimmed = term?.trim()
  return trimmed ? trimmed.slice(0, 120) : null
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const input = await searchParams
  const term = queryTerm(input)
  return {
    title: term ? `Search results for “${term}”` : 'Shop all furniture and electronics',
    description:
      'Browse every published CasaCircuit product with transparent GST-inclusive prices, documented specifications and filters for brand, price and attributes.',
    alternates: { canonical: '/products' },
    robots: term ? { index: false, follow: true } : { index: true, follow: true },
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const input = await searchParams
  const query = parsePublicCatalogQuery(searchParamsFromRecord(input))
  const results = await searchCatalog(query)
  const heading = query.q ? `Results for “${query.q}”` : 'All products'

  const activeFilterCount =
    query.brands.length +
    Object.values(query.attributes).reduce((total, values) => total + values.length, 0) +
    (query.minPrice !== undefined ? 1 : 0) +
    (query.maxPrice !== undefined ? 1 : 0) +
    (query.inStock ? 1 : 0)

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Catalogue</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {heading}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {query.q
            ? 'Search matches product names, descriptions and catalogue keywords. Refine with the filters below.'
            : 'Every listing shows tax-inclusive pricing, declared origin and the specifications that matter. Use the filters to narrow the edit.'}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-semibold">
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </h2>
            <div className="mt-4">
              <CatalogFilters action="/products" facets={results.facets} query={query} />
            </div>
          </div>
        </aside>

        <section aria-label="Products">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>
              {results.total} product{results.total === 1 ? '' : 's'}
              {activeFilterCount > 0 ? ' after filters' : ''}
            </p>
            <p>
              Page {results.page} of {results.totalPages}
            </p>
          </div>

          <ProductGrid
            products={results.items}
            resetHref={query.q ? '/products' : catalogResetHref('/products', query)}
            emptyTitle={query.q ? 'No products matched that search' : undefined}
            emptyBody={
              query.q
                ? 'Check the spelling, try a broader term, or browse the categories instead.'
                : undefined
            }
          />

          <CatalogPagination basePath="/products" query={query} totalPages={results.totalPages} />

          {results.items.length > 0 ? (
            <JsonLd
              data={itemListJsonLd(
                heading,
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
