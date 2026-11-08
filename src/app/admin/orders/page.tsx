import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { AdminPageHeader } from '@/components/admin/form-fields'
import type { OrderStatus } from '@/generated/prisma/client'
import { getCurrentActor } from '@/lib/auth/guards'
import { formatINR } from '@/lib/money'
import { hasPermission } from '@/lib/permissions'
import { listOrdersForStaff, orderStatusLabel } from '@/modules/orders/order.service'

export const metadata: Metadata = { title: 'Order Management' }
export const dynamic = 'force-dynamic'

const STATUS_FILTERS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURN_REQUESTED', label: 'Return Requests' },
]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'orders:read')) {
    return <AccessDenied permission="orders:read" />
  }

  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const statusParam = (typeof params.status === 'string' ? params.status : 'ALL') as
    | OrderStatus
    | 'ALL'

  const orders = await listOrdersForStaff({
    status: statusParam,
    query: q || undefined,
    take: 100,
  })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders & Fulfilment"
        description="Track customer orders, manage fulfilment progression, and inspect tax invoices."
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {STATUS_FILTERS.map((tab) => {
          const isActive = statusParam === tab.value
          const href =
            tab.value === 'ALL'
              ? `/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ''}`
              : `/admin/orders?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`

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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <form className="flex items-center gap-3 text-sm">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search order #, email, or phone…"
            className="h-9 w-72 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
          {statusParam !== 'ALL' && <input type="hidden" name="status" value={statusParam} />}
          <button
            type="submit"
            className="h-9 rounded-md bg-secondary px-3 text-xs font-medium hover:bg-secondary/80"
          >
            Search
          </button>
          {q && (
            <Link
              href={statusParam === 'ALL' ? '/admin/orders' : `/admin/orders?status=${statusParam}`}
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Clear
            </Link>
          )}
        </form>

        <p className="text-xs text-muted-foreground">Showing {orders.length} orders</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Order Number</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Total Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No orders found matching the filter.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-medium">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-primary hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    {o.invoice ? (
                      <p className="text-[10px] text-muted-foreground">
                        Inv: {o.invoice.invoiceNumber}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{o.email}</p>
                    <p className="text-[11px] text-muted-foreground">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{o.items.length}</td>
                  <td className="px-4 py-3 text-right font-semibold font-mono">
                    {formatINR(o.grandTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        o.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : o.paymentStatus === 'REFUNDED'
                            ? 'bg-secondary text-muted-foreground'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ({o.payments[0]?.method ?? 'ONLINE'})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : o.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : o.status === 'SHIPPED'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-secondary text-foreground'
                      }`}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-secondary"
                    >
                      <Eye className="size-3" /> Details
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
