import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { AdminPageHeader } from '@/components/admin/form-fields'
import { getCurrentActor } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { listStockMovements, listWarehouses } from '@/modules/inventory/inventory.service'

export const metadata: Metadata = { title: 'Stock Movement Logs' }
export const dynamic = 'force-dynamic'

export default async function StockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'inventory:read')) {
    return <AccessDenied permission="inventory:read" />
  }

  const params = await searchParams
  const warehouseId = typeof params.warehouseId === 'string' ? params.warehouseId : undefined

  const [warehouses, movements] = await Promise.all([
    listWarehouses(),
    listStockMovements({ warehouseId, take: 100 }),
  ])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Stock Movement Ledger"
        description="Immutable record of receipts, allocations, releases, damage, and adjustments."
        actions={
          <Link
            href="/admin/inventory"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-secondary"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to stock table
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <form className="flex items-center gap-3 text-sm">
          <select
            name="warehouseId"
            defaultValue={warehouseId ?? ''}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.code} ({wh.name})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 rounded-md bg-secondary px-3 text-xs font-medium hover:bg-secondary/80"
          >
            Filter
          </button>
          {warehouseId && (
            <Link
              href="/admin/inventory/movements"
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Reset
            </Link>
          )}
        </form>

        <p className="text-xs text-muted-foreground">Showing last {movements.length} movements</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Warehouse</th>
              <th className="px-4 py-3">SKU / Product</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3 text-right">On Hand After</th>
              <th className="px-4 py-3 text-right">Reserved After</th>
              <th className="px-4 py-3">Reason / Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-[11px]">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground font-sans text-xs">
                  No stock movements recorded yet.
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{m.warehouse.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-sans font-medium text-foreground">{m.variant.product.name}</p>
                    <p className="text-muted-foreground">{m.variant.sku} · {m.variant.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
                      {m.type.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span
                      className={
                        m.quantity > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : m.quantity < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-muted-foreground'
                      }
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{m.onHandAfter}</td>
                  <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">
                    {m.reservedAfter}
                  </td>
                  <td className="px-4 py-3 font-sans text-muted-foreground">
                    {m.reason ?? m.referenceId ?? '—'}
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
