import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, History } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { AdminPageHeader } from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { listInventoryForStaff, listWarehouses } from '@/modules/inventory/inventory.service'

import { AdjustStockForm } from './adjust-stock-form'

export const metadata: Metadata = { title: 'Inventory Management' }
export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'inventory:read')) {
    return <AccessDenied permission="inventory:read" />
  }

  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)

  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const warehouseId = typeof params.warehouseId === 'string' ? params.warehouseId : undefined
  const lowStockOnly = params.lowStock === 'true' || params.lowStock === '1'

  const [warehouses, inventoryData, variants] = await Promise.all([
    listWarehouses(),
    listInventoryForStaff({
      warehouseId,
      lowStockOnly,
      query: q || undefined,
    }),
    prisma.productVariant.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        product: { select: { name: true } },
      },
      orderBy: { sku: 'asc' },
      take: 200,
    }),
  ])

  const canAdjust = hasPermission(actor.permissions, 'inventory:adjust')

  const totalOnHand = inventoryData.items.reduce((acc, row) => acc + row.onHand, 0)
  const totalReserved = inventoryData.items.reduce((acc, row) => acc + row.reserved, 0)
  const totalSellable = inventoryData.items.reduce((acc, row) => acc + row.sellable, 0)
  const lowStockCount = inventoryData.items.filter((row) => row.isLowStock).length

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Inventory & Stock Ledger"
        description="Monitor multi-warehouse stock, reservations, and immutable movement logs."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/inventory/movements"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-secondary"
            >
              <History className="size-3.5" aria-hidden="true" />
              Movement logs
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total On-Hand</p>
          <p className="mt-1 font-display text-2xl font-semibold">{totalOnHand}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Reservations</p>
          <p className="mt-1 font-display text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {totalReserved}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Net Sellable</p>
          <p className="mt-1 font-display text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {totalSellable}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Low Stock Alerts</p>
          <p
            className={`mt-1 font-display text-2xl font-semibold ${
              lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
            }`}
          >
            {lowStockCount}
          </p>
        </div>
      </div>

      {canAdjust ? (
        <AdjustStockForm
          csrfToken={csrfToken}
          warehouses={warehouses}
          variants={variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            title: v.name,
            productName: v.product.name,
          }))}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <form className="flex flex-wrap items-center gap-3 text-sm">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search SKU or product…"
            className="h-9 w-64 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
          />

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

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="lowStock"
              value="true"
              defaultChecked={lowStockOnly}
              className="rounded-sm border-input"
            />
            Low stock only
          </label>

          <button
            type="submit"
            className="h-9 rounded-md bg-secondary px-3 text-xs font-medium hover:bg-secondary/80"
          >
            Filter
          </button>
          {(q || warehouseId || lowStockOnly) && (
            <Link
              href="/admin/inventory"
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Reset
            </Link>
          )}
        </form>

        <p className="text-xs text-muted-foreground">
          Showing {inventoryData.items.length} inventory records
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Warehouse</th>
              <th className="px-4 py-3">Product / SKU</th>
              <th className="px-4 py-3 text-right">On Hand</th>
              <th className="px-4 py-3 text-right">Reserved</th>
              <th className="px-4 py-3 text-right">Damaged</th>
              <th className="px-4 py-3 text-right font-semibold">Sellable</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inventoryData.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No inventory records match the selected criteria.
                </td>
              </tr>
            ) : (
              inventoryData.items.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] font-mono">
                      {row.warehouse.code}
                    </span>
                    <span className="ml-2 text-muted-foreground">{row.warehouse.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{row.variant.product.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {row.variant.sku} · {row.variant.name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{row.onHand}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400">
                    {row.reserved}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400">
                    {row.damaged}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    <span
                      className={
                        row.sellable <= 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : row.isLowStock
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                      }
                    >
                      {row.sellable}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.sellable <= 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="size-3" /> Out of stock
                      </span>
                    ) : row.isLowStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-3" /> Low stock (≤{row.lowStockThreshold})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" /> Healthy
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground font-mono text-[11px]">
                    {new Date(row.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
