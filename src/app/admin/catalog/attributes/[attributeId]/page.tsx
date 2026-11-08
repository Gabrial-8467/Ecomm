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
  TextField,
  inputClass,
} from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { getAttribute } from '@/modules/catalog'

import { deleteAttributeAction, updateAttributeAction } from '../../actions'

export const metadata: Metadata = { title: 'Edit attribute' }

export const dynamic = 'force-dynamic'

const DATA_TYPES = [
  { value: 'SELECT', label: 'Select (single option)' },
  { value: 'MULTI_SELECT', label: 'Multi-select' },
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Yes / No' },
]

export default async function AttributeDetailPage({
  params,
}: {
  params: Promise<{ attributeId: string }>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }
  const { attributeId } = await params
  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)
  const canWrite = hasPermission(actor.permissions, 'catalog:write')
  const canDelete = hasPermission(actor.permissions, 'catalog:delete')

  const attribute = await getAttribute(attributeId)
  const optionText = attribute.options
    .filter((option) => option.isActive)
    .map((option) => `${option.value}|${option.label}`)
    .join('\n')

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog · Attributes"
        title={attribute.name}
        description={`${attribute.code} · ${attribute.dataType}`}
        actions={
          <Link
            href="/admin/catalog/attributes"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All attributes
          </Link>
        }
      />

      {canWrite ? (
        <Card title="Attribute settings">
          <ActionForm
            action={updateAttributeAction}
            submitLabel="Save attribute"
            pendingLabel="Saving…"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="id" value={attribute.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" name="name" defaultValue={attribute.name} required />
              <TextField label="Code" name="code" defaultValue={attribute.code} required />
              <SelectField
                label="Data type"
                name="dataType"
                options={DATA_TYPES}
                defaultValue={attribute.dataType}
              />
              <TextField label="Unit" name="unit" defaultValue={attribute.unit} />
              <TextField
                label="Sort order"
                name="sortOrder"
                type="number"
                defaultValue={attribute.sortOrder}
              />
              <Field label="Options">
                <textarea
                  name="options"
                  rows={6}
                  defaultValue={optionText}
                  className={inputClass + ' h-auto min-h-32 py-2 font-mono text-xs'}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              Options removed from this list are deactivated rather than deleted, preserving
              historical product values.
            </p>
            <div className="flex flex-wrap gap-5">
              <CheckboxField label="Active" name="isActive" defaultChecked={attribute.isActive} />
              <CheckboxField
                label="Filterable"
                name="isFilterable"
                defaultChecked={attribute.isFilterable}
              />
              <CheckboxField
                label="Variant axis"
                name="isVariantAxis"
                defaultChecked={attribute.isVariantAxis}
              />
              <CheckboxField
                label="Comparable"
                name="isComparable"
                defaultChecked={attribute.isComparable}
              />
            </div>
          </ActionForm>
        </Card>
      ) : null}

      {canDelete ? (
        <Card
          title="Danger zone"
          description="Attributes used by products or variants can only be deactivated."
        >
          <ActionForm
            action={deleteAttributeAction}
            submitLabel="Delete attribute"
            pendingLabel="Deleting…"
            compact
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="id" value={attribute.id} />
          </ActionForm>
        </Card>
      ) : null}
    </div>
  )
}
