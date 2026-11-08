import type { Metadata } from 'next'
import Link from 'next/link'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import {
  AdminPageHeader,
  Card,
  CheckboxField,
  Field,
  SelectField,
  TextAreaField,
  TextField,
  inputClass,
} from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import {
  getAttributes,
  getCategoryDetail,
  getCategoryTree,
  type CategoryTreeNode,
} from '@/modules/catalog'

import {
  deleteCategoryAction,
  setCategoryAttributesAction,
  updateCategoryAction,
} from '../../actions'

export const metadata: Metadata = { title: 'Edit category' }

export const dynamic = 'force-dynamic'

const SHIPPING_CLASSES = [
  { value: 'STANDARD', label: 'Standard parcel' },
  { value: 'FURNITURE', label: 'Furniture (scheduled)' },
  { value: 'FRAGILE', label: 'Fragile' },
  { value: 'HEAVY', label: 'Heavy / two-person' },
]

function flatten(nodes: CategoryTreeNode[], depth = 0): { id: string; label: string }[] {
  return nodes.flatMap((node) => [
    { id: node.id, label: `${'— '.repeat(depth)}${node.name}` },
    ...flatten(node.children, depth + 1),
  ])
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string }>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }
  const { categoryId } = await params
  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)
  const canWrite = hasPermission(actor.permissions, 'catalog:write')
  const canDelete = hasPermission(actor.permissions, 'catalog:delete')

  const [category, attributes, tree] = await Promise.all([
    getCategoryDetail(categoryId),
    getAttributes({ includeInactive: true }),
    getCategoryTree(),
  ])
  const parentOptions = flatten(tree).filter((option) => option.id !== category.id)
  const assigned = new Map(
    category.categoryAttributes.map((entry) => [entry.attributeId, entry]),
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog · Categories"
        title={category.name}
        description={category.path}
        actions={
          <Link
            href="/admin/catalog/categories"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All categories
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Products</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {category._count.products}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Child categories</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {category._count.children}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Level</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{category.level}</p>
        </div>
      </div>

      {canWrite ? (
        <Card title="Category settings">
          <ActionForm
            action={updateCategoryAction}
            submitLabel="Save category"
            pendingLabel="Saving…"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="id" value={category.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" name="name" defaultValue={category.name} required />
              <TextField label="Slug" name="slug" defaultValue={category.slug} required />
              <Field label="Parent category">
                <select name="parentId" className={inputClass} defaultValue={category.parentId ?? ''}>
                  <option value="">None (root category)</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <TextField
                label="Sort order"
                name="sortOrder"
                type="number"
                defaultValue={category.sortOrder}
              />
              <TextField
                label="Return window (days)"
                name="returnWindowDays"
                type="number"
                defaultValue={category.returnWindowDays}
              />
              <TextField
                label="Warranty (months)"
                name="warrantyMonths"
                type="number"
                defaultValue={category.warrantyMonths ?? ''}
              />
              <SelectField
                label="Shipping class"
                name="shippingClass"
                options={SHIPPING_CLASSES}
                defaultValue={category.shippingClass}
              />
              <TextField label="Image URL" name="imageUrl" defaultValue={category.imageUrl} />
              <TextField label="Icon" name="icon" defaultValue={category.icon} />
            </div>
            <TextAreaField
              label="Description"
              name="description"
              defaultValue={category.description}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="SEO title" name="seoTitle" defaultValue={category.seoTitle} />
              <TextField
                label="SEO description"
                name="seoDescription"
                defaultValue={category.seoDescription}
              />
            </div>
            <div className="flex flex-wrap gap-5">
              <CheckboxField label="Active" name="isActive" defaultChecked={category.isActive} />
              <CheckboxField
                label="Returnable"
                name="isReturnable"
                defaultChecked={category.isReturnable}
              />
              <CheckboxField
                label="Replacement allowed"
                name="replacementAllowed"
                defaultChecked={category.replacementAllowed}
              />
            </div>
          </ActionForm>
        </Card>
      ) : null}

      {canWrite ? (
        <Card
          title="Attribute assignment"
          description="Required attributes block publishing when missing. Filterable attributes appear as storefront facets."
        >
          <ActionForm
            action={setCategoryAttributesAction}
            submitLabel="Save attributes"
            pendingLabel="Saving…"
            compact
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="categoryId" value={category.id} />
            <div className="grid gap-2">
              {attributes.map((attribute) => {
                const entry = assigned.get(attribute.id)
                return (
                  <div
                    key={attribute.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="attributeId"
                        value={attribute.id}
                        defaultChecked={Boolean(entry)}
                        className="size-4 rounded border-input accent-primary"
                      />
                      <span className="font-medium">{attribute.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {attribute.code}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        name={`required_${attribute.id}`}
                        defaultChecked={entry?.isRequired ?? false}
                        className="size-4 rounded border-input accent-primary"
                      />
                      Required
                    </label>
                  </div>
                )
              })}
            </div>
          </ActionForm>
        </Card>
      ) : null}

      {canDelete ? (
        <Card title="Danger zone" description="Categories with products or children cannot be deleted.">
          <ActionForm
            action={deleteCategoryAction}
            submitLabel="Delete category"
            pendingLabel="Deleting…"
            compact
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="id" value={category.id} />
          </ActionForm>
        </Card>
      ) : null}
    </div>
  )
}
