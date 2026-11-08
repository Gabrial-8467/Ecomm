import { SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { catalogResetHref, type CatalogQueryState } from '@/lib/catalog-url'
import type { CatalogFacets } from '@/modules/catalog'

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Customer rating' },
  { value: 'popular', label: 'Most popular' },
  { value: 'discount', label: 'Biggest discount' },
]

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function CatalogFilters({
  action,
  facets,
  query,
}: {
  action: string
  facets: CatalogFacets
  query: CatalogQueryState
}) {
  const resetHref = catalogResetHref(action, query)

  return (
    <form method="get" action={action} className="space-y-6" aria-label="Filter products">
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
      {query.category ? <input type="hidden" name="category" value={query.category} /> : null}

      <div>
        <label htmlFor="catalog-sort" className="text-xs font-semibold tracking-[0.14em] uppercase">
          Sort by
        </label>
        <select
          id="catalog-sort"
          name="sort"
          defaultValue={query.sort}
          className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>

      {facets.price ? (
        <fieldset>
          <legend className="text-xs font-semibold tracking-[0.14em] uppercase">Price</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            {money.format(facets.price.min)} – {money.format(facets.price.max)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <label className="sr-only" htmlFor="filter-min-price">
              Minimum price
            </label>
            <input
              id="filter-min-price"
              name="minPrice"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Min"
              defaultValue={query.minPrice}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
            <span aria-hidden="true" className="text-muted-foreground">
              –
            </span>
            <label className="sr-only" htmlFor="filter-max-price">
              Maximum price
            </label>
            <input
              id="filter-max-price"
              name="maxPrice"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Max"
              defaultValue={query.maxPrice}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>
        </fieldset>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="inStock"
          value="true"
          defaultChecked={query.inStock}
          className="size-4 rounded border-input accent-primary"
        />
        In stock only
      </label>

      {facets.brands.length > 0 ? (
        <fieldset>
          <legend className="text-xs font-semibold tracking-[0.14em] uppercase">Brand</legend>
          <ul className="mt-3 space-y-2">
            {facets.brands.map((brand) => (
              <li key={brand.slug}>
                <label className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="brand"
                      value={brand.slug}
                      defaultChecked={query.brands.includes(brand.slug)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    {brand.name}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{brand.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      {facets.attributes.map((attribute) => (
        <fieldset key={attribute.code}>
          <legend className="text-xs font-semibold tracking-[0.14em] uppercase">
            {attribute.name}
            {attribute.unit ? (
              <span className="ml-1 font-normal text-muted-foreground lowercase">
                ({attribute.unit})
              </span>
            ) : null}
          </legend>
          <ul className="mt-3 space-y-2">
            {attribute.values.map((value) => (
              <li key={`${attribute.code}-${value.value}`}>
                <label className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name={`attr.${attribute.code}`}
                      value={value.value}
                      defaultChecked={query.attributes[attribute.code]?.includes(value.value)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    {value.label}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{value.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}

      <div className="flex flex-col gap-2">
        <Button type="submit" size="sm">
          <SlidersHorizontal aria-hidden="true" />
          Apply filters
        </Button>
        <Link
          href={resetHref}
          className="text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </Link>
      </div>
    </form>
  )
}
