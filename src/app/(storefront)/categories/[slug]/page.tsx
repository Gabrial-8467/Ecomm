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
  categoryMetadata,
  findCategoryBySlug,
  getCategoryPage,
  getCategoryTree,
  itemListJsonLd,
  parsePublicCatalogQuery,
  type CategoryTreeNode,
} from '@/modules/catalog'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<PageSearchParams>
}

function findNode(nodes: CategoryTreeNode[], id: string): CategoryTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = findNode(node.children, id)
    if (child) return child
  }
  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await findCategoryBySlug(slug)
  if (!category || !category.isActive || category.archivedAt) {
    return { title: 'Category not found', robots: { index: false, follow: false } }
  }
  return categoryMetadata(category)
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const input = await searchParams
  const query = parsePublicCatalogQuery(searchParamsFromRecord(input))
  const [page, tree] = await Promise.all([
    getCategoryPage(slug, query),
    getCategoryTree({ activeOnly: true }),
  ])
  if (!page) notFound()

  const node = findNode(tree, page.category.id)
  const children = node?.children ?? []
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    ...page.breadcrumb.map((item) => ({ name: item.name, path: `/categories/${item.slug}` })),
  ]

  return (
    <div className="container-page py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          {page.breadcrumb.map((item) => (
            <li key={item.slug} className="flex items-center gap-1">
              <ChevronRight className="size-3" aria-hidden="true" />
              <Link href={`/categories/${item.slug}`} className="hover:text-foreground">
                {item.name}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <header className="mt-4 border-b border-border pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Category</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {page.category.name}
        </h1>
        {page.category.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {page.category.description}
          </p>
        ) : (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {page.total} product{page.total === 1 ? '' : 's'} in this category. Prices include GST
            and every listing states its country of origin.
          </p>
        )}
      </header>

      {children.length > 0 ? (
        <nav aria-label="Subcategories" className="mt-5 flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-accent/60 hover:text-accent"
            >
              {child.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-semibold">Filters</h2>
            <div className="mt-4">
              <CatalogFilters
                action={`/categories/${page.category.slug}`}
                facets={page.facets}
                query={query}
              />
            </div>
          </div>
        </aside>

        <section aria-label={`${page.category.name} products`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>
              {page.total} product{page.total === 1 ? '' : 's'}
            </p>
            <p>
              Page {page.page} of {page.totalPages}
            </p>
          </div>

          <ProductGrid
            products={page.items}
            resetHref={catalogResetHref(`/categories/${page.category.slug}`, query)}
          />

          <CatalogPagination
            basePath={`/categories/${page.category.slug}`}
            query={query}
            totalPages={page.totalPages}
          />

          <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
          {page.items.length > 0 ? (
            <JsonLd
              data={itemListJsonLd(
                page.category.name,
                page.items.map((product) => ({
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
