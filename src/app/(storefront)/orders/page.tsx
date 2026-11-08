import type { Metadata } from 'next'
import { ArrowRight, CheckCircle2, Clock, Package, ShoppingBag, Truck, XCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { listOrdersForViewer } from '@/modules/orders/order.service'

export const metadata: Metadata = {
  title: 'Your Orders | CasaCircuit',
  description: 'View your order history, invoices, and shipment status.',
  robots: { index: false, follow: true },
}

export const dynamic = 'force-dynamic'

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function StatusPill({ status }: { status: string }) {
  switch (status) {
    case 'DELIVERED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
          <CheckCircle2 className="size-3" aria-hidden="true" />
          Delivered
        </span>
      )
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          <Truck className="size-3" aria-hidden="true" />
          {status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' : 'Shipped'}
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
          <XCircle className="size-3" aria-hidden="true" />
          Cancelled
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
          <Clock className="size-3" aria-hidden="true" />
          {status.replaceAll('_', ' ').toLowerCase()}
        </span>
      )
  }
}

export default async function OrdersPage() {
  const orders = await listOrdersForViewer()

  if (orders.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
          <Package className="size-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">No orders placed yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          When you place orders on CasaCircuit, they will appear here with live tracking and tax invoices.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/products">
              <ShoppingBag className="size-4 mr-2" aria-hidden="true" />
              Start shopping
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/orders/track">Track by order number</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="mb-8 border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-accent uppercase">
              Your Account
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Order History
            </h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders/track">Track guest order</Link>
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-foreground/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 text-xs">
              <div className="space-y-1">
                <span className="font-mono text-sm font-bold text-foreground">
                  {order.orderNumber}
                </span>
                <p className="text-muted-foreground">
                  Ordered on{' '}
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusPill status={order.status} />
                <span className="font-semibold text-sm tabular-nums text-foreground">
                  {money.format(Number(order.grandTotal))}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              {/* Thumbnails preview */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {order.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    title={item.productName}
                    className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Package className="size-5 m-auto text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                ))}
                {order.items.length > 4 ? (
                  <span className="text-xs text-muted-foreground font-medium pl-1">
                    +{order.items.length - 4} more
                  </span>
                ) : null}
              </div>

              <Button asChild variant="outline" size="sm">
                <Link href={`/orders/${order.orderNumber}`}>
                  View Details & Invoice
                  <ArrowRight className="size-3.5 ml-1.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
