import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { AdminPageHeader } from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { formatINR } from '@/lib/money'
import { hasPermission } from '@/lib/permissions'
import { getOrderForStaff, orderStatusLabel } from '@/modules/orders/order.service'

import { OrderStatusActions } from './order-status-actions'

export const metadata: Metadata = { title: 'Order Details' }
export const dynamic = 'force-dynamic'

interface AddressSnapshot {
  fullName?: string
  line1?: string
  line2?: string | null
  city?: string
  state?: string
  pincode?: string
  phone?: string
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'orders:read')) {
    return <AccessDenied permission="orders:read" />
  }

  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)

  const { orderId } = await params
  let order
  try {
    order = await getOrderForStaff(orderId)
  } catch {
    notFound()
  }

  const canWrite = hasPermission(actor.permissions, 'orders:write')
  const shippingAddress = order.shippingAddressSnapshot as AddressSnapshot | null
  const billingAddress = order.billingAddressSnapshot as AddressSnapshot | null
  const paymentMethod = order.payments[0]?.method ?? 'COD'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-secondary"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              All orders
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Order Status</p>
          <p className="mt-1 font-semibold">{orderStatusLabel(order.status)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Payment Status</p>
          <p className="mt-1 font-semibold">
            {order.paymentStatus} ({paymentMethod})
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="mt-1 font-display text-2xl font-semibold font-mono">
            {formatINR(order.grandTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tax Invoice</p>
          <p className="mt-1 font-mono text-sm font-semibold">
            {order.invoice?.invoiceNumber ?? 'Not generated'}
          </p>
        </div>
      </div>

      {canWrite ? (
        <OrderStatusActions
          orderId={order.id}
          currentStatus={order.status}
          paymentStatus={order.paymentStatus}
          paymentMethod={paymentMethod}
          csrfToken={csrfToken}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Order Items</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">HSN</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Tax (GST)</th>
                    <th className="px-3 py-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {item.sku} · {item.variantName}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        {item.hsnCode ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {formatINR(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        {formatINR(item.cgst.plus(item.sgst).plus(item.igst))} ({item.taxRate.toString()}%)
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">
                        {formatINR(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="flex flex-col items-end gap-1.5 text-xs">
                <div className="flex w-64 justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono">{formatINR(order.subtotal)}</span>
                </div>
                {order.discountTotal.toNumber() > 0 ? (
                  <div className="flex w-64 justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                    <span className="font-mono">-{formatINR(order.discountTotal)}</span>
                  </div>
                ) : null}
                <div className="flex w-64 justify-between">
                  <span className="text-muted-foreground">GST (IGST/CGST+SGST):</span>
                  <span className="font-mono">{formatINR(order.taxTotal)}</span>
                </div>
                <div className="flex w-64 justify-between">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span className="font-mono">{formatINR(order.shippingTotal)}</span>
                </div>
                {order.installationRequested ? (
                  <div className="flex w-64 justify-between">
                    <span className="text-muted-foreground">Furniture Installation:</span>
                    <span className="font-mono">{formatINR(order.installationCharge)}</span>
                  </div>
                ) : null}
                <div className="mt-2 flex w-64 justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatINR(order.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Fulfilment & Status History</h3>
            <div className="mt-4 space-y-3">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <Clock className="size-3" />
                  </span>
                  <div>
                    <p className="font-medium">
                      {h.fromStatus ? `${orderStatusLabel(h.fromStatus)} → ` : ''}
                      <span className="font-semibold text-foreground">
                        {orderStatusLabel(h.toStatus)}
                      </span>
                    </p>
                    {h.note ? <p className="text-muted-foreground mt-0.5">{h.note}</p> : null}
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {new Date(h.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {h.changedByUserId ? ` · Staff ID: ${h.changedByUserId}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Customer & Delivery</h3>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium text-foreground">{order.email}</p>
                <p className="font-mono text-muted-foreground">{order.phone}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Type: {order.userId ? 'Registered Customer' : 'Guest Checkout'}
                </p>
              </div>

              {shippingAddress ? (
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground">Shipping Address</p>
                  <p className="font-medium text-foreground">{shippingAddress.fullName}</p>
                  <p>{shippingAddress.line1}</p>
                  {shippingAddress.line2 ? <p>{shippingAddress.line2}</p> : null}
                  <p>
                    {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                  </p>
                </div>
              ) : null}

              {billingAddress ? (
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground">Billing Address</p>
                  <p className="font-medium text-foreground">{billingAddress.fullName}</p>
                  <p>{billingAddress.line1}</p>
                  {billingAddress.line2 ? <p>{billingAddress.line2}</p> : null}
                  <p>
                    {billingAddress.city}, {billingAddress.state} - {billingAddress.pincode}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Payment & Tax Particulars</h3>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">GST Supply State</p>
                <p className="font-medium">
                  {order.placeOfSupplyState ?? '—'}{' '}
                  <span className="text-[10px] text-muted-foreground">
                    ({order.isInterState ? 'Inter-state IGST' : 'Intra-state CGST + SGST'})
                  </span>
                </p>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground">Payment Records</p>
                {order.payments.length === 0 ? (
                  <p className="text-muted-foreground mt-1">No recorded payments.</p>
                ) : (
                  order.payments.map((p) => (
                    <div key={p.id} className="mt-2 font-mono">
                      <p className="font-medium">
                        {p.method} · {formatINR(p.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Status: {p.status}
                        {p.providerOrderId ? ` · Provider Order: ${p.providerOrderId}` : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
