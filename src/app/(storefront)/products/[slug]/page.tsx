import type { Metadata } from 'next'
import {
  BadgeCheck,
  ChevronRight,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { ProductCard } from '@/components/catalog/product-card'
import { ProductGallery } from '@/components/catalog/product-gallery'
import { JsonLd } from '@/components/seo/json-ld'
import { AddToCartForm } from '@/components/store/add-to-cart-form'
import { WishlistButton } from '@/components/store/wishlist-button'
import { getEnv } from '@/lib/env'
import { cn } from '@/lib/utils'
import {
  breadcrumbJsonLd,
  findPublishedProductBySlug,
  getRelatedProducts,
  listCategories,
  productDetailView,
  productJsonLd,
  productMetadata,
  type PublicProductView,
} from '@/modules/catalog'
import { getVariantStock } from '@/modules/cart/cart.service'
import { getWishlistProductIds } from '@/modules/wishlist/wishlist.service'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const getProduct = cache(findPublishedProductBySlug)

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function selectedVariant(view: PublicProductView, variantId: string | undefined) {
  const variants = view.variants
  return (
    variants.find((variant) => variant.id === variantId) ??
    variants.find((variant) => variant.id === view.defaultVariantId) ??
    variants[0] ??
    null
  )
}

function categoryBreadcrumb(view: PublicProductView, rows: { name: string; slug: string }[]) {
  const slugs = view.category.path.split('/').filter(Boolean)
  const bySlug = new Map(rows.map((row) => [row.slug, row]))
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((row): row is { name: string; slug: string } => row !== undefined)
}

/** Seller addresses are stored as JSON; render known address parts only. */
function formatAddress(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const parts = ['line1', 'line2', 'landmark', 'city', 'state', 'postalCode', 'country']
    .map((key) => record[key])
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
  return parts.length > 0 ? parts.join(', ') : null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } }
  return productMetadata(productDetailView(product))
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const input = await searchParams
  const product = await getProduct(slug)
  if (!product) notFound()

  const view = productDetailView(product)
  const variant = selectedVariant(view, firstValue(input.variant))
  const [related, categories, savedIds, variantStock] = await Promise.all([
    getRelatedProducts(slug, 4),
    listCategories(),
    getWishlistProductIds(),
    variant ? getVariantStock(variant.id) : Promise.resolve(0),
  ])
  const saved = savedIds.has(view.id)
  const breadcrumb = categoryBreadcrumb(view, categories)
  const sellerAddress = formatAddress(view.declarations.sellerRegisteredAddress)
  const jsonLdBreadcrumb = [
    { name: 'Home', path: '/' },
    ...breadcrumb.map((item) => ({ name: item.name, path: `/categories/${item.slug}` })),
    { name: view.name, path: `/products/${view.slug}` },
  ]

  const specificationGroups = new Map<string, typeof view.specifications>()
  for (const specification of view.specifications) {
    const group = specificationGroups.get(specification.group) ?? []
    group.push(specification)
    specificationGroups.set(specification.group, group)
  }

  const discount =
    variant && variant.mrp > variant.price && variant.mrp > 0
      ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)
      : 0

  return (
    <div className="container-page py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          {breadcrumb.map((item) => (
            <li key={item.slug} className="flex items-center gap-1">
              <ChevronRight className="size-3" aria-hidden="true" />
              <Link href={`/categories/${item.slug}`} className="hover:text-foreground">
                {item.name}
              </Link>
            </li>
          ))}
          <li className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden="true" />
            <span aria-current="page" className="line-clamp-1">
              {view.name}
            </span>
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <ProductGallery images={view.images} name={view.name} />

        <div>
          {view.brand ? (
            <Link
              href={`/brands/${view.brand.slug}`}
              className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase hover:text-accent"
            >
              {view.brand.name}
            </Link>
          ) : (
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {view.category.name}
            </p>
          )}

          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {view.name}
          </h1>

          {view.shortDescription ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{view.shortDescription}</p>
          ) : null}

          {view.rating.reviews > 0 ? (
            <p className="mt-3 text-sm">
              <span className="font-semibold">{view.rating.average.toFixed(1)} / 5</span>
              <span className="text-muted-foreground">
                {' '}
                · {view.rating.count} rating{view.rating.count === 1 ? '' : 's'} ·{' '}
                {view.rating.reviews} verified review{view.rating.reviews === 1 ? '' : 's'}
              </span>
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No verified reviews yet. Reviews open after a delivered order.
            </p>
          )}

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            {variant ? (
              <>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-2xl font-semibold tabular-nums">
                    {money.format(variant.price)}
                  </span>
                  {variant.mrp > variant.price ? (
                    <span className="text-sm text-muted-foreground tabular-nums line-through">
                      {money.format(variant.mrp)}
                    </span>
                  ) : null}
                  {discount > 0 ? (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                      {discount}% off
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Inclusive of all taxes · GST invoice included
                </p>
                {view.price.lowestPrice30Days !== null &&
                view.price.lowestPrice30Days < variant.price ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Lowest price in the last 30 days: {money.format(view.price.lowestPrice30Days)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This product is not currently available to purchase.
              </p>
            )}

            {view.variants.length > 1 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold tracking-[0.14em] uppercase">
                  Choose an option
                </p>
                <ul className="mt-2 space-y-2">
                  {view.variants.map((option) => {
                    const entries = Object.entries(option.attributes)
                    return (
                      <li key={option.id}>
                        <Link
                          href={`/products/${view.slug}?variant=${option.id}`}
                          aria-current={option.id === variant?.id ? 'true' : undefined}
                          className={cn(
                            'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
                            option.id === variant?.id
                              ? 'border-accent bg-accent/5'
                              : 'border-border hover:border-accent/50',
                          )}
                        >
                          <span>
                            <span className="font-medium">
                              {entries.length > 0
                                ? entries.map(([, value]) => value).join(' · ')
                                : option.name}
                            </span>
                            <span className="mt-0.5 block font-mono text-[0.625rem] text-muted-foreground">
                              {option.sku}
                            </span>
                          </span>
                          <span className="font-medium tabular-nums">
                            {money.format(option.price)}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}

            <div className="mt-6">
              <AddToCartForm
                variantId={variant?.id ?? null}
                maxQuantity={Math.min(variantStock, getEnv().CART_MAX_QUANTITY_PER_LINE)}
              />
              <WishlistButton productId={view.id} saved={saved} fullWidth className="mt-3" />
            </div>

            <ul className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                Delivery is confirmed against your pincode before payment.
              </li>
              {view.declarations.installationRequired ? (
                <li className="flex items-start gap-2">
                  <Wrench className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  Installation is scheduled in supported cities.
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                {view.declarations.isReturnable
                  ? `${view.declarations.returnWindowDays}-day return window from delivery${
                      view.declarations.replacementAllowed ? ', replacement available' : ''
                    }.`
                  : 'This product is not returnable. Defects are covered by warranty.'}
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                {view.declarations.warrantyType === 'NONE'
                  ? 'No additional warranty is declared for this product.'
                  : `${view.declarations.warrantyType === 'MANUFACTURER' ? 'Manufacturer' : 'Seller'} warranty: ${view.declarations.warrantyMonths ?? 0} months.`}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-8">
          {view.description ? (
            <section aria-labelledby="description-heading">
              <h2 id="description-heading" className="font-display text-xl font-semibold">
                About this product
              </h2>
              <p className="mt-3 text-sm leading-7 whitespace-pre-line text-muted-foreground">
                {view.description}
              </p>
            </section>
          ) : null}

          {view.specifications.length > 0 ? (
            <section aria-labelledby="specifications-heading">
              <h2 id="specifications-heading" className="font-display text-xl font-semibold">
                Specifications
              </h2>
              <div className="mt-3 space-y-5">
                {[...specificationGroups.entries()].map(([group, specifications]) => (
                  <div key={group}>
                    <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {group}
                    </h3>
                    <dl className="mt-2 divide-y divide-border text-sm">
                      {specifications.map((specification) => (
                        <div
                          key={`${specification.group}-${specification.label}`}
                          className="grid grid-cols-2 gap-3 py-2"
                        >
                          <dt className="text-muted-foreground">{specification.label}</dt>
                          <dd>{specification.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {view.attributes.length > 0 ? (
            <section aria-labelledby="attributes-heading">
              <h2 id="attributes-heading" className="font-display text-xl font-semibold">
                Product details
              </h2>
              <dl className="mt-3 divide-y divide-border text-sm">
                {view.attributes.map((attribute) => (
                  <div key={attribute.code} className="grid grid-cols-2 gap-3 py-2">
                    <dt className="text-muted-foreground">
                      {attribute.name}
                      {attribute.unit ? ` (${attribute.unit})` : ''}
                    </dt>
                    <dd>{attribute.value ?? '—'}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>

        <aside className="space-y-8">
          <section
            aria-labelledby="declarations-heading"
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 id="declarations-heading" className="font-display text-lg font-semibold">
              Seller and legal declarations
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Sold by</dt>
                <dd className="font-medium">{view.declarations.sellerLegalName}</dd>
                {sellerAddress ? (
                  <dd className="mt-0.5 text-xs text-muted-foreground">{sellerAddress}</dd>
                ) : null}
              </div>
              {view.declarations.manufacturerName ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Manufacturer</dt>
                  <dd>{view.declarations.manufacturerName}</dd>
                  {view.declarations.manufacturerAddress ? (
                    <dd className="text-xs text-muted-foreground">
                      {view.declarations.manufacturerAddress}
                    </dd>
                  ) : null}
                </div>
              ) : null}
              {view.declarations.packerName ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Packer</dt>
                  <dd>{view.declarations.packerName}</dd>
                </div>
              ) : null}
              {view.declarations.importerName ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Importer</dt>
                  <dd>{view.declarations.importerName}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Country of origin</dt>
                <dd>{view.declarations.countryOfOrigin}</dd>
              </div>
              {view.declarations.netQuantity ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Net quantity</dt>
                  <dd>
                    {view.declarations.netQuantity} {view.declarations.unitOfMeasure ?? ''}
                  </dd>
                </div>
              ) : null}
              {view.declarations.unitSalePrice ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Unit sale price</dt>
                  <dd>{money.format(Number(view.declarations.unitSalePrice))}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">HSN / GST</dt>
                <dd>
                  {view.declarations.hsnCode ?? '—'} · {view.declarations.gstRate ?? '—'}%
                </dd>
              </div>
              {view.declarations.bisRegistrationNo ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">BIS registration</dt>
                  <dd>{view.declarations.bisRegistrationNo}</dd>
                </div>
              ) : null}
              {view.declarations.consumerCareEmail || view.declarations.consumerCarePhone ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Consumer care</dt>
                  {view.declarations.consumerCareEmail ? (
                    <dd>
                      <a
                        className="hover:text-accent"
                        href={`mailto:${view.declarations.consumerCareEmail}`}
                      >
                        {view.declarations.consumerCareEmail}
                      </a>
                    </dd>
                  ) : null}
                  {view.declarations.consumerCarePhone ? (
                    <dd>{view.declarations.consumerCarePhone}</dd>
                  ) : null}
                </div>
              ) : null}
            </dl>
            <p className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Declarations are captured per product and validated before publishing. Business
              identifiers are shown only once verified.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-secondary/40 p-5 text-sm">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <PackageCheck className="size-5 text-accent" aria-hidden="true" />
              What happens after an order
            </h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                Stock is reserved atomically; an order is never confirmed against unavailable
                inventory.
              </li>
              <li>A GST invoice is generated with the declarations shown on this page.</li>
              <li>
                Delivery, installation and returns are tracked against the order and policy version.
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2 id="related-heading" className="font-display text-2xl font-semibold tracking-tight">
            You may also like
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} saved={savedIds.has(item.id)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <JsonLd data={[productJsonLd(view), breadcrumbJsonLd(jsonLdBreadcrumb)]} />
    </div>
  )
}
