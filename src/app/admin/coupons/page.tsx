import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { AdminPageHeader } from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { formatINR } from '@/lib/money'
import { hasPermission } from '@/lib/permissions'
import { listCoupons } from '@/modules/pricing/coupon.service'

import { ToggleCouponButton } from './toggle-coupon-button'

export const metadata: Metadata = { title: 'Coupons' }
export const dynamic = 'force-dynamic'

export default async function AdminCouponsPage() {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'coupons:read')) {
    return <AccessDenied permission="coupons:read" />
  }

  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)

  const coupons = await listCoupons()
  const canWrite = hasPermission(actor.permissions, 'coupons:write')

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotions & Coupons"
        description="Configure promotional vouchers, discount percentage/fixed rules, and usage quotas."
        actions={
          canWrite ? (
            <Link
              href="/admin/coupons/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Create Coupon
            </Link>
          ) : null
        }
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-right">Min Order</th>
              <th className="px-4 py-3 text-right">Max Discount</th>
              <th className="px-4 py-3 text-center">Usage</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No coupons configured yet. Click &ldquo;Create Coupon&rdquo; to add one.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold">
                    <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-foreground">
                      {c.code}
                    </span>
                    {c.description ? (
                      <p className="mt-0.5 text-[11px] font-sans font-normal text-muted-foreground">
                        {c.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase font-mono">
                      {c.type.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {c.type === 'PERCENTAGE'
                      ? `${c.value.toString()}%`
                      : c.type === 'FIXED_AMOUNT'
                        ? formatINR(c.value)
                        : 'Free Shipping'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {c.minOrderValue ? formatINR(c.minOrderValue) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {c.maxDiscount ? formatINR(c.maxDiscount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                    {c.usedCount}
                    {c.totalUsageLimit ? ` / ${c.totalUsageLimit}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canWrite ? (
                      <ToggleCouponButton
                        couponId={c.id}
                        isActive={c.isActive}
                        csrfToken={csrfToken}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
