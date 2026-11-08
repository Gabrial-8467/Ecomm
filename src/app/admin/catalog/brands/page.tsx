import type { Metadata } from 'next'
import Link from 'next/link'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import {
  AdminPageHeader,
  CheckboxField,
  TextAreaField,
  TextField,
} from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { getBrands } from '@/modules/catalog'

import { createBrandAction } from '../actions'

export const metadata: Metadata = { title: 'Brands' }

export const dynamic = 'force-dynamic'

export default async function BrandsPage() {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }
  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)
  const canWrite = hasPermission(actor.permissions, 'catalog:write')

  const brands = await getBrands({ includeInactive: true })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Brands"
        description="Brands are optional on a product but improve facets, SEO and trust."
        actions={
          <Link href="/admin/catalog" className="text-sm text-muted-foreground hover:text-foreground">
            ← Catalog
          </Link>
        }
      />

      <section className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-secondary/50 text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Brand</th>
              <th className="px-3 py-2 font-medium">Products</th>
              <th className="px-3 py-2 font-medium">Featured</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No brands yet.
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/catalog/brands/${brand.id}`}
                      className="font-medium hover:text-accent hover:underline"
                    >
                      {brand.name}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">/{brand.slug}</p>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{brand._count.products}</td>
                  <td className="px-3 py-2">{brand.isFeatured ? 'Yes' : '—'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        brand.isActive
                          ? 'rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success'
                          : 'rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground'
                      }
                    >
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {canWrite ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">New brand</h2>
          <ActionForm
            action={createBrandAction}
            submitLabel="Create brand"
            pendingLabel="Creating…"
            className="mt-4"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" name="name" required />
              <TextField label="Slug" name="slug" />
              <TextField label="Logo URL" name="logoUrl" />
              <TextField label="SEO title" name="seoTitle" />
            </div>
            <TextAreaField label="Description" name="description" rows={3} />
            <TextField label="SEO description" name="seoDescription" />
            <div className="flex flex-wrap gap-5">
              <CheckboxField label="Active" name="isActive" defaultChecked />
              <CheckboxField label="Featured" name="isFeatured" />
            </div>
          </ActionForm>
        </section>
      ) : null}
    </div>
  )
}
