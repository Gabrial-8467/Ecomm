import type { Metadata } from 'next'
import Link from 'next/link'

import { AccessDenied } from '@/components/admin/access-denied'
import {
  AdminPageHeader,
  Field,
  StatusBadge,
  inputClass,
} from '@/components/admin/form-fields'
import { getCurrentActor } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { getBrands, getCategoryTree, listAdminProducts, type CategoryTreeNode } from '@/modules/catalog'

export const metadata: Metadata = { title: 'Products' }

export const dynamic = 'force-dynamic'

const STATUSES = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function flatten(nodes: CategoryTreeNode[], depth = 0): { id: string; label: string }[] {
  return nodes.flatMap((node) => [
    { id: node.id, label: `${'— '.repeat(depth)}${node.name}` },
    ...flatten(node.children, depth + 1),
  ])
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }

  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const statusParam = typeof params.status === 'string' ? params.status : 'ALL'
  const status = (['DRAFT', 'ACTIVE', 'ARCHIVED', 'ALL'] as const).includes(
    statusParam as 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'ALL',
  )
    ? (statusParam as 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'ALL')
    : 'ALL'
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : undefined
  const brandId = typeof params.brandId === 'string' ? params.brandId : undefined
  const page = Math.max(1, Number(typeof params.page === 'string' ? params.page : 1) || 1)

  const [result, categories, brands] = await Promise.all([
    listAdminProducts({
      q: q || undefined,
      status,
      categoryId,
      brandId,
      page,
      limit: 20,
    }),
    getCategoryTree(),
    getBrands({ includeInactive: true }),
  ])
  const categoryOptions = flatten(categories)
  const canWrite = hasPermission(actor.permissions, 'catalog:write')

  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (status !== 'ALL') baseParams.set('status', status)
  if (categoryId) baseParams.set('categoryId', categoryId)
  if (brandId) baseParams.set('brandId', brandId)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Drafts stay invisible to customers until every Legal Metrology declaration passes."
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/admin/catalog"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Catalog
            </Link>
            {canWrite ? (
              <Link
                href="/admin/catalog/products/new"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                New product
              </Link>
            ) : null}
          </div>
        }
      />

      <form className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <Field label="Search">
          <input
            className={inputClass}
            name="q"
            defaultValue={q}
            placeholder="Name, base SKU or variant SKU"
          />
        </Field>
        <Field label="Status">
          <select className={inputClass} name="status" defaultValue={status}>
            {STATUSES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select className={inputClass} name="categoryId" defaultValue={categoryId ?? ''}>
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Brand">
          <select className={inputClass} name="brandId" defaultValue={brandId ?? ''}>
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
          >
            Filter
          </button>
        </div>
      </form>

      <section className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-secondary/50 text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Variants</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  No products match these filters.
                </td>
              </tr>
            ) : (
              result.items.map((product) => {
                const prices = product.variants.map((variant) => Number(variant.price.toString()))
                const min = prices.length ? Math.min(...prices) : 0
                const max = prices.length ? Math.max(...prices) : 0
                const image = product.images[0]
                return (
                  <tr key={product.id} className="border-t border-border align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-3">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-secondary">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image.url}
                              alt=""
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-[0.625rem] text-muted-foreground">No image</span>
                          )}
                        </span>
                        <span className="flex flex-col">
                          <Link
                            href={`/admin/catalog/products/${product.id}`}
                            className="font-medium hover:text-accent hover:underline"
                          >
                            {product.name}
                          </Link>
                          <span className="font-mono text-xs text-muted-foreground">
                            {product.baseSku}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{product.category.name}</td>
                    <td className="px-3 py-3 tabular-nums">{product.variants.length}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {product.variants.length === 0
                        ? '—'
                        : min === max
                          ? money.format(min)
                          : `${money.format(min)} – ${money.format(max)}`}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {product.updatedAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {result.total} product{result.total === 1 ? '' : 's'} · page {result.page} of{' '}
          {result.totalPages}
        </p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              href={`/admin/catalog/products?${new URLSearchParams([
                ...baseParams.entries(),
                ['page', String(result.page - 1)],
              ]).toString()}`}
              className="rounded-md border border-border px-3 py-1.5 hover:bg-secondary"
            >
              Previous
            </Link>
          ) : null}
          {result.page < result.totalPages ? (
            <Link
              href={`/admin/catalog/products?${new URLSearchParams([
                ...baseParams.entries(),
                ['page', String(result.page + 1)],
              ]).toString()}`}
              className="rounded-md border border-border px-3 py-1.5 hover:bg-secondary"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
