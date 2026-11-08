import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { catalogHref, type CatalogQueryState } from '@/lib/catalog-url'

function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const values = new Set<number>([1, total, current - 1, current, current + 1])
  if (current <= 3) [2, 3, 4].forEach((value) => values.add(value))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((value) => values.add(value))
  const sorted = [...values].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b)
  const output: (number | 'ellipsis')[] = []
  for (const value of sorted) {
    const previous = output[output.length - 1]
    if (typeof previous === 'number' && value - previous > 1) output.push('ellipsis')
    output.push(value)
  }
  return output
}

export function CatalogPagination({
  basePath,
  query,
  totalPages,
}: {
  basePath: string
  query: CatalogQueryState
  totalPages: number
}) {
  if (totalPages <= 1) return null
  const current = Math.min(Math.max(query.page, 1), totalPages)

  return (
    <nav aria-label="Catalogue pagination" className="mt-10 flex items-center justify-center gap-1">
      {current > 1 ? (
        <Link
          href={catalogHref(basePath, query, { page: current - 1 })}
          rel="prev"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-sm hover:bg-secondary"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-sm opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </span>
      )}

      {pageNumbers(current, totalPages).map((page, index) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={catalogHref(basePath, query, { page })}
            aria-current={page === current ? 'page' : undefined}
            className={
              page === current
                ? 'inline-flex size-9 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground'
                : 'inline-flex size-9 items-center justify-center rounded-md border border-border text-sm hover:bg-secondary'
            }
          >
            {page}
          </Link>
        ),
      )}

      {current < totalPages ? (
        <Link
          href={catalogHref(basePath, query, { page: current + 1 })}
          rel="next"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-sm hover:bg-secondary"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-sm opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  )
}
