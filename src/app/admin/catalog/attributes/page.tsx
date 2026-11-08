import type { Metadata } from 'next'
import Link from 'next/link'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import {
  AdminPageHeader,
  CheckboxField,
  Field,
  SelectField,
  TextField,
  inputClass,
} from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { getAttributes } from '@/modules/catalog'

import { createAttributeAction } from '../actions'

export const metadata: Metadata = { title: 'Attributes' }

export const dynamic = 'force-dynamic'

const DATA_TYPES = [
  { value: 'SELECT', label: 'Select (single option)' },
  { value: 'MULTI_SELECT', label: 'Multi-select' },
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Yes / No' },
]

export default async function AttributesPage() {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }
  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)
  const canWrite = hasPermission(actor.permissions, 'catalog:write')

  const attributes = await getAttributes({ includeInactive: true })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Attributes"
        description="Attributes power filters and variant axes. Select attributes carry their own options."
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
              <th className="px-3 py-2 font-medium">Attribute</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Options</th>
              <th className="px-3 py-2 font-medium">Variant axis</th>
              <th className="px-3 py-2 font-medium">Filterable</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {attributes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No attributes yet.
                </td>
              </tr>
            ) : (
              attributes.map((attribute) => (
                <tr key={attribute.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/catalog/attributes/${attribute.id}`}
                      className="font-medium hover:text-accent hover:underline"
                    >
                      {attribute.name}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{attribute.code}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{attribute.dataType}</td>
                  <td className="px-3 py-2 tabular-nums">{attribute.options.length}</td>
                  <td className="px-3 py-2">{attribute.isVariantAxis ? 'Yes' : '—'}</td>
                  <td className="px-3 py-2">{attribute.isFilterable ? 'Yes' : '—'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        attribute.isActive
                          ? 'rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success'
                          : 'rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground'
                      }
                    >
                      {attribute.isActive ? 'Active' : 'Inactive'}
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
          <h2 className="font-display text-lg font-semibold">New attribute</h2>
          <ActionForm
            action={createAttributeAction}
            submitLabel="Create attribute"
            pendingLabel="Creating…"
            className="mt-4"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" name="name" required />
              <TextField label="Code" name="code" placeholder="screen_size_inch" required />
              <SelectField
                label="Data type"
                name="dataType"
                options={DATA_TYPES}
                defaultValue="SELECT"
              />
              <TextField label="Unit" name="unit" placeholder="inch, kg, W" />
              <TextField label="Sort order" name="sortOrder" type="number" defaultValue={0} />
              <Field label="Options">
                <textarea
                  name="options"
                  rows={4}
                  className={inputClass + ' h-auto min-h-24 py-2 font-mono text-xs'}
                  placeholder={'black|Black\nwalnut|Walnut\nnatural|Natural'}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter one option per line as <code>value|Label</code>. Required for select types.
            </p>
            <div className="flex flex-wrap gap-5">
              <CheckboxField label="Active" name="isActive" defaultChecked />
              <CheckboxField label="Filterable" name="isFilterable" defaultChecked />
              <CheckboxField label="Variant axis" name="isVariantAxis" />
              <CheckboxField label="Comparable" name="isComparable" />
            </div>
          </ActionForm>
        </section>
      ) : null}
    </div>
  )
}
