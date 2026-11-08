import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, Clock, Eye } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { AdminPageHeader } from '@/components/admin/form-fields'
import type { ReturnStatus } from '@/generated/prisma/client'
import { getCurrentActor } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { listReturnsForStaff } from '@/modules/orders/return.service'

export const metadata: Metadata = { title: 'Returns Management' }
export const dynamic = 'force-dynamic'

const STATUS_FILTERS: { value: ReturnStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Requests' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'RECEIVED', label: 'Received' },
]

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'returns:read')) {
    return <AccessDenied permission="returns:read" />
  }

  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const statusParam = (typeof params.status === 'string' ? params.status : 'ALL') as
    | ReturnStatus
    | 'ALL'

  const returns = await listReturnsForStaff({
    status: statusParam,
    query: q || undefined,
    take: 100,
  })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Returns & Reverse Logistics"
        description="Inspect customer return requests, enforce statutory 48h acknowledgement SLA, and issue refunds."
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {STATUS_FILTERS.map((tab) => {
          const isActive = statusParam === tab.value
          const href =
            tab.value === 'ALL'
              ? `/admin/returns${q ? `?q=${encodeURIComponent(q)}` : ''}`
              : `/admin/returns?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`

          return (
            <Link
              key={tab.value}
              href={href}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Return #</th>
              <th className="px-4 py-3">Order Number</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Statutory SLA</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No return requests found.
                </td>
              </tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-medium">
                      <Link
                        href={`/admin/returns/${r.id}`}
                        className="text-primary hover:underline"
                      >
                        {r.returnNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <Link
                        href={`/admin/orders/${r.order.id}`}
                        className="text-muted-foreground hover:underline"
                      >
                        {r.order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.order.email}</p>
                      <p className="text-[11px] text-muted-foreground">{r.order.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.reason.replaceAll('_', ' ')}</span>
                      {r.description ? (
                        <p className="max-w-xs truncate text-[11px] text-muted-foreground">
                          {r.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{r.items.length}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : r.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.slaDueAt ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono ${
                            r.isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-semibold'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {r.isOverdue ? <AlertCircle className="size-3" /> : <Clock className="size-3" />}
                          {r.isOverdue
                            ? 'Overdue'
                            : new Date(r.slaDueAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/returns/${r.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-secondary"
                      >
                        <Eye className="size-3" /> Inspect
                      </Link>
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
