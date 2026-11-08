'use client'

import { useState } from 'react'

import { ActionForm } from '@/components/admin/action-form'
import { Field, SelectField, TextField, inputClass } from '@/components/admin/form-fields'
import { Button } from '@/components/ui/button'

import { adjustStockAction } from './actions'

interface WarehouseOption {
  id: string
  code: string
  name: string
}

interface VariantOption {
  id: string
  sku: string
  title: string
  productName: string
}

export function AdjustStockForm({
  csrfToken,
  warehouses,
  variants,
  defaultVariantId,
  defaultWarehouseId,
}: {
  csrfToken: string
  warehouses: WarehouseOption[]
  variants: VariantOption[]
  defaultVariantId?: string
  defaultWarehouseId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Adjust stock
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold">Stock Adjustment</h3>
          <p className="text-xs text-muted-foreground">
            Record a verified change to on-hand inventory with an audit trail.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>

      <ActionForm
        action={adjustStockAction}
        submitLabel="Commit adjustment"
        pendingLabel="Committing…"
        className="mt-4"
      >
        <input type="hidden" name="csrfToken" value={csrfToken} />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Warehouse"
            name="warehouseId"
            defaultValue={defaultWarehouseId ?? warehouses[0]?.id}
            options={warehouses.map((wh) => ({
              value: wh.id,
              label: `${wh.code} — ${wh.name}`,
            }))}
          />

          <Field label="Product Variant">
            <select
              name="variantId"
              defaultValue={defaultVariantId ?? variants[0]?.id}
              className={inputClass}
              required
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.sku} · {v.productName} ({v.title})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Adjustment Type"
            name="type"
            defaultValue="ADJUSTMENT"
            options={[
              { value: 'ADJUSTMENT', label: 'Manual Adjustment (+/-)' },
              { value: 'PURCHASE_RECEIPT', label: 'Purchase Receipt (+)' },
              { value: 'DAMAGE', label: 'Damaged Goods (+ damaged, - on-hand)' },
              { value: 'RETURN_RECEIVED', label: 'Customer Return Restock (+)' },
            ]}
          />

          <TextField
            label="Quantity"
            name="quantity"
            type="number"
            defaultValue="1"
            placeholder="e.g. 10 or -5"
            hint="Positive to add, negative to decrement for manual adjustments."
            required
          />
        </div>

        <TextField
          label="Reason / Reference"
          name="reason"
          placeholder="e.g. Cycle count verification, PO-10283 receipt, or damaged in transit"
          hint="Mandatory audit explanation for regulatory compliance."
          required
        />
      </ActionForm>
    </div>
  )
}
