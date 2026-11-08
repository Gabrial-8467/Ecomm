import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import { AdminPageHeader, SelectField, TextField } from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { formatINR } from '@/lib/money'
import { hasPermission } from '@/lib/permissions'
import { listWarehouses } from '@/modules/inventory/inventory.service'
import { getReturnForStaff } from '@/modules/orders/return.service'

import { reviewReturnAction } from '../actions'

export const metadata: Metadata = { title: 'Inspect Return Request' }
export const dynamic = 'force-dynamic'

export default async function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ returnId: string }>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'returns:read')) {
    return <AccessDenied permission="returns:read" />
  }

  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)

  const { returnId } = await params
  let ret
  try {
    ret = await getReturnForStaff(returnId)
  } catch {
    notFound()
  }

  const warehouses = await listWarehouses()
  const canApprove = hasPermission(actor.permissions, 'returns:approve')
  const isPending = ret.status === 'REQUESTED' || ret.status === 'UNDER_REVIEW'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Return Request ${ret.returnNumber}`}
        description={`For Order ${ret.order.orderNumber} · Customer: ${ret.order.email}`}
        actions={
          <Link
            href="/admin/returns"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-secondary"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            All returns
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Return Status</p>
          <p className="mt-1 font-semibold">{ret.status}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Stated Reason</p>
          <p className="mt-1 font-semibold">{ret.reason.replaceAll('_', ' ')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Statutory Acknowledgement Due</p>
          <p className="mt-1 font-mono text-sm">
            {ret.slaDueAt
              ? new Date(ret.slaDueAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Resolution</p>
          <p className="mt-1 font-semibold">{ret.resolution ?? 'Pending Inspection'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Items Requested for Return</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Return Qty</th>
                    <th className="px-3 py-2">Declared Condition</th>
                    <th className="px-3 py-2">Restock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ret.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-foreground">{item.orderItem.productName}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {item.orderItem.sku} · {item.orderItem.variantName}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono">
                          {item.condition}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{item.restockStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ret.description ? (
              <div className="mt-4 border-t border-border pt-4 text-xs">
                <p className="font-semibold text-foreground">Customer Statement:</p>
                <p className="mt-1 text-muted-foreground leading-relaxed">{ret.description}</p>
              </div>
            ) : null}
          </div>

          {canApprove && isPending ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">Staff Inspection & Review Decision</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Approving this request automatically queues a refund and restocks resalable items to the selected warehouse.
              </p>

              <ActionForm
                action={reviewReturnAction}
                submitLabel="Submit Inspection Decision"
                pendingLabel="Recording decision…"
                className="mt-4"
              >
                <input type="hidden" name="csrfToken" value={csrfToken} />
                <input type="hidden" name="returnId" value={ret.id} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="Review Decision"
                    name="action"
                    defaultValue="APPROVE"
                    options={[
                      { value: 'APPROVE', label: 'Approve Return & Queue Refund' },
                      { value: 'REJECT', label: 'Reject Return Request' },
                    ]}
                  />

                  <SelectField
                    label="Restock Warehouse (if approved & resalable)"
                    name="restockWarehouseId"
                    defaultValue={warehouses[0]?.id}
                    options={warehouses.map((wh) => ({
                      value: wh.id,
                      label: `${wh.code} — ${wh.name}`,
                    }))}
                  />
                </div>

                <TextField
                  label="Inspection Notes (Internal)"
                  name="inspectionNotes"
                  placeholder="e.g. Visual verification confirmed defective power module"
                />

                <TextField
                  label="Rejection Reason (Required if rejecting)"
                  name="rejectionReason"
                  placeholder="e.g. Returned after statutory 7-day window or customer physical damage"
                />
              </ActionForm>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 text-xs space-y-2">
              <h3 className="font-semibold text-sm">Decision Record</h3>
              <p>
                <span className="text-muted-foreground">Inspected by:</span>{' '}
                <span className="font-mono">{ret.inspectedBy ?? 'Staff'}</span>
              </p>
              {ret.inspectionNotes ? (
                <p>
                  <span className="text-muted-foreground">Notes:</span> {ret.inspectionNotes}
                </p>
              ) : null}
              {ret.rejectionReason ? (
                <p className="text-destructive">
                  <span className="font-semibold">Rejection reason:</span> {ret.rejectionReason}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 text-xs space-y-3">
            <h3 className="font-semibold text-sm">Order Context</h3>
            <div>
              <p className="text-muted-foreground">Order Reference</p>
              <Link
                href={`/admin/orders/${ret.order.id}`}
                className="font-mono font-semibold text-primary hover:underline"
              >
                {ret.order.orderNumber}
              </Link>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium text-foreground">{ret.order.email}</p>
              <p className="font-mono text-muted-foreground">{ret.order.phone}</p>
            </div>
          </div>

          {ret.refunds.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-5 text-xs space-y-3">
              <h3 className="font-semibold text-sm">Linked Refunds</h3>
              {ret.refunds.map((rf) => (
                <div key={rf.id} className="font-mono text-xs space-y-1">
                  <p className="font-semibold text-foreground">{rf.refundNumber}</p>
                  <p className="text-muted-foreground">Amount: {formatINR(rf.amount)}</p>
                  <p className="text-muted-foreground">Status: {rf.status}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
