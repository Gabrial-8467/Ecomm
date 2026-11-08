import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import { AdminPageHeader, SelectField, TextField } from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'

import { createCouponAction } from '../actions'

export const metadata: Metadata = { title: 'Create Coupon' }
export const dynamic = 'force-dynamic'

export default async function NewCouponPage() {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'coupons:write')) {
    return <AccessDenied permission="coupons:write" />
  }

  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Create New Coupon"
        description="Define discount parameters, order minimums, and usage caps."
        actions={
          <Link
            href="/admin/coupons"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-secondary"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to coupons
          </Link>
        }
      />

      <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
        <ActionForm
          action={createCouponAction}
          submitLabel="Create Coupon"
          pendingLabel="Creating coupon…"
        >
          <input type="hidden" name="csrfToken" value={csrfToken} />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Coupon Code"
              name="code"
              placeholder="e.g. SUMMER20"
              hint="Letters, numbers, underscores, or hyphens (3-24 chars)."
              required
            />

            <SelectField
              label="Discount Type"
              name="type"
              defaultValue="PERCENTAGE"
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED_AMOUNT', label: 'Fixed Amount (₹)' },
                { value: 'FREE_SHIPPING', label: 'Free Shipping' },
              ]}
            />
          </div>

          <TextField
            label="Description"
            name="description"
            placeholder="e.g. 20% off on all living room furniture"
            hint="Displayed to customer on cart summary upon application."
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Value"
              name="value"
              placeholder="e.g. 20 or 500"
              hint="Percentage (e.g. 15) or amount in ₹."
            />

            <TextField
              label="Max Discount (₹)"
              name="maxDiscount"
              placeholder="e.g. 1000"
              hint="Cap for percentage discounts."
            />

            <TextField
              label="Min Order Value (₹)"
              name="minOrderValue"
              placeholder="e.g. 1999"
              hint="Cart subtotal threshold."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Total Usage Limit"
              name="totalUsageLimit"
              type="number"
              placeholder="e.g. 500"
              hint="Global redemption quota across all customers."
            />

            <TextField
              label="Per Customer Limit"
              name="perCustomerLimit"
              type="number"
              defaultValue="1"
              placeholder="e.g. 1"
              hint="Maximum redemptions per customer."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Start Date"
              name="startsAt"
              type="datetime-local"
              hint="When this voucher becomes valid."
            />

            <TextField
              label="End Date"
              name="endsAt"
              type="datetime-local"
              hint="Expiry date/time."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="firstOrderOnly"
              value="true"
              className="rounded-sm border-input"
            />
            Eligible for first-time orders only
          </label>
        </ActionForm>
      </div>
    </div>
  )
}
