import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbJsonLd, getCategoryTree } from '@/modules/catalog'

export const metadata: Metadata = {
  title: 'Shop by category',
  description:
    'Browse every CasaCircuit category across furniture and electronics, with documented specifications and GST-inclusive prices.',
  alternates: { canonical: '/categories' },
}

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const tree = await getCategoryTree({ activeOnly: true })

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Catalogue</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Shop by category
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Start with the room or the system. Each category page can be filtered by brand, price and
          the attributes that actually differentiate the product.
        </p>
      </header>

      {tree.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
          Categories are being prepared. Check back shortly.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {tree.map((root) => (
            <section key={root.id} aria-labelledby={`category-${root.slug}`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id={`category-${root.slug}`}
                    className="font-display text-2xl font-semibold tracking-tight"
                  >
                    {root.name}
                  </h2>
                  {root.description ? (
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      {root.description}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/categories/${root.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:text-accent"
                >
                  Shop {root.name}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              {root.children.length > 0 ? (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {root.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="flex h-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-accent/60"
                      >
                        <span>
                          <span className="block text-sm font-medium">{child.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {child.isReturnable
                              ? `${child.returnWindowDays}-day returns`
                              : 'Non-returnable'}
                            {child.warrantyMonths
                              ? ` · ${child.warrantyMonths}-month warranty`
                              : ''}
                          </span>
                        </span>
                        <ArrowUpRight
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      )}

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Categories', path: '/categories' },
        ])}
      />
    </div>
  )
}
