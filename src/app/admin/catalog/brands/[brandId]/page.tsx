import type { Metadata } from 'next'
import Link from 'next/link'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import {
  AdminPageHeader,
  Card,
  CheckboxField,
  TextAreaField,
  TextField,
} from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { getBrand } from '@/modules/catalog'

import { deleteBrandAction, updateBrandAction } from '../../actions'

export const metadata: Metadata = { title: 'Edit brand' }

export const dynamic = 'force-dynamic'

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ brandId: string }>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }
  const { brandId } = await params
  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)
  const canWrite = hasPermission(actor.permissions, 'catalog:write')
  const canDelete = hasPermission(actor.permissions, 'catalog:delete')

  const brand = await getBrand(brandId)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog · Brands"
        title={brand.name}
        description={`/${brand.slug} · ${brand._count.products} product${brand._count.products === 1 ? '' : 's'}`}
        actions={
          <Link
            href="/admin/catalog/brands"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All brands
          </Link>
        }
      />

      {canWrite ? (
        <Card title="Brand settings">
          <ActionForm action={updateBrandAction} submitLabel="Save brand" pendingLabel="Saving…">
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="id" value={brand.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" name="name" defaultValue={brand.name} required />
              <TextField label="Slug" name="slug" defaultValue={brand.slug} required />
              <TextField label="Logo URL" name="logoUrl" defaultValue={brand.logoUrl} />
              <TextField label="SEO title" name="seoTitle" defaultValue={brand.seoTitle} />
            </div>
            <TextAreaField
              label="Description"
              name="description"
              defaultValue={brand.description}
              rows={3}
            />
            <TextField
              label="SEO description"
              name="seoDescription"
              defaultValue={brand.seoDescription}
            />
            <div className="flex flex-wrap gap-5">
              <CheckboxField label="Active" name="isActive" defaultChecked={brand.isActive} />
              <CheckboxField
                label="Featured"
                name="isFeatured"
                defaultChecked={brand.isFeatured}
              />
            </div>
          </ActionForm>
        </Card>
      ) : null}

      {canDelete ? (
        <Card title="Danger zone" description="Brands linked to products cannot be deleted.">
          <ActionForm
            action={deleteBrandAction}
            submitLabel="Delete brand"
            pendingLabel="Deleting…"
            compact
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="id" value={brand.id} />
          </ActionForm>
        </Card>
      ) : null}
    </div>
  )
}
