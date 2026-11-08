import type { Metadata } from 'next'
import Link from 'next/link'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import {
  AdminPageHeader,
  CheckboxField,
  Field,
  SelectField,
  TextAreaField,
  TextField,
  inputClass,
} from '@/components/admin/form-fields'
import { getCurrentActor, getCurrentSession, csrfTokenForForm } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { getCategoryTree, type CategoryTreeNode } from '@/modules/catalog'

import { createCategoryAction } from '../actions'

export const metadata: Metadata = { title: 'Categories' }

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

function CategoryRow({ node, depth }: { node: CategoryTreeNode; depth: number }) {
  return (
    <>
      <tr className="border-t border-border">
        <td className="px-3 py-2">
          <span style={{ paddingLeft: `${depth * 1.25}rem` }} className="inline-flex flex-col">
            <Link
              href={`/admin/catalog/categories/${node.id}`}
              className="font-medium hover:text-accent hover:underline"
            >
              {node.name}
            </Link>
            <span className="font-mono text-xs text-muted-foreground">{node.path}</span>
          </span>
        </td>
        <td className="px-3 py-2 text-sm text-muted-foreground">{node.returnWindowDays} days</td>
        <td className="px-3 py-2 text-sm text-muted-foreground">{node.shippingClass}</td>
        <td className="px-3 py-2">
          <span
            className={
              node.isActive
                ? 'rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success'
                : 'rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground'
            }
          >
            {node.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-3 py-2 text-right text-sm tabular-nums">{node.sortOrder}</td>
      </tr>
      {node.children.map((child) => (
        <CategoryRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  )
}

export default async function CategoriesPage() {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }
  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)
  const canWrite = hasPermission(actor.permissions, 'catalog:write')

  const tree = await getCategoryTree()
  const options = flatten(tree)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Categories carry return-policy defaults and determine which attributes a product must declare."
        actions={
          <Link
            href="/admin/catalog"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Catalog
          </Link>
        }
      />

      <section className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-secondary/50 text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Return window</th>
              <th className="px-3 py-2 font-medium">Shipping</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Order</th>
            </tr>
          </thead>
          <tbody>
            {tree.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No categories yet. Create the first root category below.
                </td>
              </tr>
            ) : (
              tree.map((node) => <CategoryRow key={node.id} node={node} depth={0} />)
            )}
          </tbody>
        </table>
      </section>

      {canWrite ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">New category</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave the slug blank to generate one. The path is derived from the parent.
          </p>
          <ActionForm
            action={createCategoryAction}
            submitLabel="Create category"
            pendingLabel="Creating…"
            className="mt-4"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" name="name" required />
              <TextField label="Slug" name="slug" placeholder="sofas-seating" />
              <Field label="Parent category">
                <select name="parentId" className={inputClass} defaultValue="">
                  <option value="">None (root category)</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <TextField label="Sort order" name="sortOrder" type="number" defaultValue={0} />
              <TextField
                label="Return window (days)"
                name="returnWindowDays"
                type="number"
                defaultValue={7}
              />
              <SelectField
                label="Shipping class"
                name="shippingClass"
                options={SHIPPING_CLASSES}
                defaultValue="STANDARD"
              />
              <TextField label="Image URL" name="imageUrl" />
              <TextField label="Icon" name="icon" placeholder="sofa" />
            </div>
            <TextAreaField label="Description" name="description" rows={3} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="SEO title" name="seoTitle" />
              <TextField label="SEO description" name="seoDescription" />
            </div>
            <div className="flex flex-wrap gap-5">
              <CheckboxField label="Active" name="isActive" defaultChecked />
              <CheckboxField label="Returnable" name="isReturnable" defaultChecked />
              <CheckboxField label="Replacement allowed" name="replacementAllowed" defaultChecked />
            </div>
          </ActionForm>
        </section>
      ) : null}
    </div>
  )
}
