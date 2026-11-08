import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Boxes, FolderTree, Layers, Tag } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { AdminPageHeader, Card } from '@/components/admin/form-fields'
import { getCurrentActor } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { getCatalogCounts, getPlatformSeller } from '@/modules/catalog'

export const metadata: Metadata = { title: 'Catalog' }

export const dynamic = 'force-dynamic'

const LINKS = [
  {
    href: '/admin/catalog/products',
    title: 'Products',
    description: 'Variants, pricing, images, specifications and publishing.',
    icon: Boxes,
  },
  {
    href: '/admin/catalog/categories',
    title: 'Categories',
    description: 'Category tree, return policy defaults and required attributes.',
    icon: FolderTree,
  },
  {
    href: '/admin/catalog/brands',
    title: 'Brands',
    description: 'Brand identity, featured placement and SEO copy.',
    icon: Tag,
  },
  {
    href: '/admin/catalog/attributes',
    title: 'Attributes',
    description: 'Filterable facets and the axes used by variant matrices.',
    icon: Layers,
  },
]

export default async function CatalogOverviewPage() {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }

  const [counts, seller] = await Promise.all([
    getCatalogCounts(),
    getPlatformSeller().catch(() => null),
  ])

  const sellerIncomplete =
    !seller ||
    !seller.legalName ||
    !seller.registeredAddress ||
    (!seller.customerCareEmail && !seller.customerCarePhone)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products, variants and taxonomy"
        description="Manage the customer-facing catalog. Publishing is blocked until Legal Metrology declarations and the seller identity are complete."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Products', value: counts.products },
          { label: 'Published', value: counts.published },
          { label: 'Drafts', value: counts.drafts },
          { label: 'Categories', value: counts.categories },
          { label: 'Brands', value: counts.brands },
          { label: 'Attributes', value: counts.attributes },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {sellerIncomplete ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
          <h2 className="font-display text-lg font-semibold">Seller declarations incomplete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The platform seller record is a placeholder. Add the verified legal name, registered
            address, GSTIN/PAN and consumer-care contact before publishing any product. Until then,
            publish attempts are rejected by the declaration validator.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/50 hover:bg-secondary/40"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
              <link.icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-3 flex items-center gap-2 font-display text-lg font-semibold">
              {link.title}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
          </Link>
        ))}
      </div>

      <Card title="Publishing rules">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>A product needs an active variant with a positive price and MRP ≥ selling price.</li>
          <li>At least one image with descriptive alt text is required.</li>
          <li>HSN code, GST rate, country of origin, packer and net quantity must be declared.</li>
          <li>Manufacturer/importer, unit sale price and consumer-care contact are required.</li>
          <li>Required category attributes must be present before publishing.</li>
          <li>
            The seller legal name, registered address and consumer-care contact must be configured.
          </li>
        </ul>
      </Card>
    </div>
  )
}
