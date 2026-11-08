import type { Metadata } from 'next'
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CancelOrderButton } from '@/components/store/cancel-order-button'
import { ReturnRequestButton } from '@/components/store/return-request-button'
import { Button } from '@/components/ui/button'
import { NotFoundError } from '@/lib/errors'
import { getOrderForViewer } from '@/modules/orders/order.service'
import { isOrderReturnEligible } from '@/modules/orders/return.service'

export const dynamic = 'force-dynamic'

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}): Promise<Metadata> {
  const { orderNumber } = await params
  return {
    title: `Order ${orderNumber} | CasaCircuit`,
    description: `Track and view details for order ${orderNumber}.`,
    robots: { index: false, follow: false },
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DELIVERED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          Delivered
        </span>
      )
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Truck className="size-3.5" aria-hidden="true" />
          {status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' : 'Shipped'}
        </span>
      )
    case 'CONFIRMED':
    case 'PROCESSING':
    case 'PACKED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          <Package className="size-3.5" aria-hidden="true" />
          {status === 'CONFIRMED' ? 'Confirmed' : status === 'PROCESSING' ? 'Processing' : 'Packed'}
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
          <XCircle className="size-3.5" aria-hidden="true" />
          Cancelled
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Clock className="size-3.5" aria-hidden="true" />
          {status}
        </span>
      )
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params

  let order
  try {
    order = await getOrderForViewer(orderNumber)
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  const shippingAddr =
    order.shippingAddressSnapshot && typeof order.shippingAddressSnapshot === 'object'
      ? (order.shippingAddressSnapshot as Record<string, unknown>)
      : null

  const isCancellable = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)

  return (
    <div className="container-page py-10 lg:py-14">
      {/* Navigation & Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/orders">
            <ArrowLeft className="size-4 mr-2" aria-hidden="true" />
            Back to all orders
          </Link>
        </Button>
        <StatusBadge status={order.status} />
      </div>

      <header className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Order Confirmation
            </p>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {order.orderNumber}
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                dateStyle: 'long',
                timeZone: 'Asia/Kolkata',
              })} at {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                timeStyle: 'short',
                timeZone: 'Asia/Kolkata',
              })}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Order Amount</p>
            <p className="text-2xl font-bold text-accent tabular-nums">
              {money.format(Number(order.grandTotal))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {order.paymentStatus === 'PAID' ? (
                <span className="text-success font-semibold flex items-center justify-end gap-1">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Paid via {order.payments[0]?.method === 'RAZORPAY' ? 'Online Gateway' : 'COD'}
                </span>
              ) : order.payments[0]?.method === 'COD' ? (
                <span>Pay on delivery</span>
              ) : (
                <span className="text-amber-500 font-semibold">Payment Pending</span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid: Details & Invoicing */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Items, Status Events, Actions */}
        <div className="space-y-8 lg:col-span-8">
          {/* Ordered Items */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h2 className="flex items-center gap-2 border-b border-border pb-4 font-display text-lg font-semibold">
              <Package className="size-5 text-accent" aria-hidden="true" />
              Items in this shipment ({order.items.length})
            </h2>

            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-start gap-4 py-4 sm:flex-nowrap">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Package className="size-6 m-auto text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-semibold text-sm text-foreground">{item.productName}</h3>
                    <p className="text-xs text-muted-foreground">
                      Option: <span className="font-medium text-foreground/80">{item.variantName}</span> · SKU:{' '}
                      <span className="font-mono">{item.sku}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      HSN: <span className="font-mono">{item.hsnCode}</span> · GST Rate:{' '}
                      {Number(item.taxRate)}%
                    </p>
                    <p className="text-xs text-muted-foreground pt-1">
                      {item.quantity} × {money.format(Number(item.unitPrice))} each (GST inclusive)
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-sm tabular-nums">
                      {money.format(Number(item.lineTotal))}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Tax: {money.format(Number(item.taxableValue))} taxable +{' '}
                      {order.isInterState
                        ? `${money.format(Number(item.igst))} IGST`
                        : `${money.format(Number(item.cgst))} CGST + ${money.format(Number(item.sgst))} SGST`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Self-Service Actions */}
          {isCancellable ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <h2 className="font-display text-base font-semibold">Need to modify or cancel?</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                You can cancel this order online before it has been dispatched for delivery.
              </p>
              <div className="mt-4">
                <CancelOrderButton orderNumber={order.orderNumber} />
              </div>
            </div>
          ) : null}

          {/* Return & Replacement Requests */}
          {order.returns && order.returns.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-xs space-y-3">
              <h2 className="font-display text-base font-semibold">Return & Replacement Requests</h2>
              <div className="space-y-3">
                {order.returns.map((ret) => (
                  <div key={ret.id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold">{ret.returnNumber}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                        {ret.status}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Reason: {ret.reason.replaceAll('_', ' ')}
                    </p>
                    {ret.description ? (
                      <p className="mt-1 text-[11px] text-foreground/80">{ret.description}</p>
                    ) : null}
                    {ret.rejectionReason ? (
                      <p className="mt-1 text-[11px] text-destructive">
                        Rejection reason: {ret.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : isOrderReturnEligible(order).eligible ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-xs">
              <h2 className="font-display text-base font-semibold">Returns & Replacements</h2>
              <p className="mt-1 text-muted-foreground">
                This order was delivered within the past 7 days and is eligible for return or replacement.
              </p>
              <div className="mt-4">
                <ReturnRequestButton
                  orderNumber={order.orderNumber}
                  items={order.items.map((i) => ({
                    id: i.id,
                    productName: i.productName,
                    variantTitle: i.variantName,
                    quantity: i.quantity,
                  }))}
                />
              </div>
            </div>
          ) : null}

          {/* Statutory Redressal & Help */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <HelpCircle className="size-4 text-accent" aria-hidden="true" />
              Customer Support & Grievance Redressal
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions regarding your delivery, invoices or warranty, our support team
              is here to assist. Mention order reference{' '}
              <span className="font-mono font-semibold text-foreground">{order.orderNumber}</span>.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <Button asChild variant="outline" size="sm">
                <Link href={`/contact?order=${order.orderNumber}`}>Contact Support</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/faq">Delivery & Return FAQs</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Delivery Address, Invoice, Financial Breakdown */}
        <div className="space-y-8 lg:col-span-4">
          {/* Shipping Address */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-xs space-y-3">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold border-b border-border pb-3">
              <MapPin className="size-4 text-accent" aria-hidden="true" />
              Delivery Address
            </h2>

            {shippingAddr ? (
              <div className="space-y-1.5 text-muted-foreground">
                <p className="font-semibold text-sm text-foreground">
                  {String(shippingAddr.fullName ?? '')}
                </p>
                <p>{String(shippingAddr.phone ?? '')}</p>
                {shippingAddr.email ? <p>{String(shippingAddr.email)}</p> : null}
                <p className="text-foreground/90 pt-1 leading-relaxed">
                  {String(shippingAddr.line1 ?? '')}
                  {shippingAddr.line2 ? `, ${String(shippingAddr.line2)}` : ''}
                  {shippingAddr.landmark ? ` (Near ${String(shippingAddr.landmark)})` : ''}
                  <br />
                  {String(shippingAddr.city ?? '')}, {String(shippingAddr.state ?? '')} —{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {String(shippingAddr.pincode ?? '')}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Address snapshot not available.</p>
            )}

            {order.installationRequested ? (
              <div className="mt-3 rounded bg-secondary/50 p-2.5 text-[11px] text-foreground flex items-center gap-1.5">
                <Building className="size-3.5 text-accent shrink-0" aria-hidden="true" />
                <span>Professional furniture assembly requested.</span>
              </div>
            ) : null}
          </div>

          {/* Sequential Tax Invoice Details */}
          {order.invoice ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-xs space-y-2">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold border-b border-border pb-3">
                <FileText className="size-4 text-accent" aria-hidden="true" />
                Tax Invoice
              </h2>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span className="font-mono font-semibold text-foreground">{order.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Financial Year:</span>
                <span className="font-mono">{order.invoice.financialYear}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span>
                  {new Date(order.invoice.invoiceDate).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  })}
                </span>
              </div>
              {order.invoice.sellerGstin ? (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Seller GSTIN:</span>
                  <span className="font-mono">{order.invoice.sellerGstin}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Place of Supply:</span>
                <span>{order.invoice.placeOfSupply ?? order.placeOfSupplyState ?? 'India'}</span>
              </div>
            </div>
          ) : null}

          {/* Financial Breakdown */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-xs">
            <h2 className="font-display text-base font-semibold border-b border-border pb-3">
              Payment Summary
            </h2>

            <dl className="mt-4 space-y-2.5">
              <div className="flex justify-between text-muted-foreground">
                <dt>Goods Subtotal</dt>
                <dd className="font-medium text-foreground tabular-nums">
                  {money.format(Number(order.subtotal))}
                </dd>
              </div>

              {Number(order.discountTotal) > 0 ? (
                <div className="flex justify-between text-success">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                  <dd className="font-semibold tabular-nums">
                    −{money.format(Number(order.discountTotal))}
                  </dd>
                </div>
              ) : null}

              <div className="flex justify-between text-muted-foreground">
                <dt>Delivery Fee</dt>
                <dd className="font-medium text-foreground tabular-nums">
                  {Number(order.shippingTotal) === 0 ? (
                    <span className="text-success font-semibold">FREE</span>
                  ) : (
                    money.format(Number(order.shippingTotal))
                  )}
                </dd>
              </div>

              {Number(order.codFee) > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <dt>COD Convenience Fee</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {money.format(Number(order.codFee))}
                  </dd>
                </div>
              ) : null}

              <div className="flex justify-between text-muted-foreground border-t border-border pt-2">
                <dt>Total GST (included)</dt>
                <dd className="tabular-nums">{money.format(Number(order.taxTotal))}</dd>
              </div>

              <div className="flex justify-between border-t border-border pt-3 text-sm font-bold text-foreground">
                <dt>Grand Total</dt>
                <dd className="text-accent tabular-nums">
                  {money.format(Number(order.grandTotal))}
                </dd>
              </div>
            </dl>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
                Verified Legal Metrology
              </span>
              <span>All taxes included</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
