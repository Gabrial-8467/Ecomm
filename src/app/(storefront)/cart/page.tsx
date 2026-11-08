import type { Metadata } from 'next'
import { ArrowRight, ImageIcon, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { CartLineControls } from '@/components/store/cart-line-controls'
import { ClearCartButton } from '@/components/store/clear-cart-button'
import { CouponForm } from '@/components/store/coupon-form'
import { Button } from '@/components/ui/button'
import { getEnv } from '@/lib/env'
import { getCartView } from '@/modules/cart/cart.service'

export const metadata: Metadata = {
  title: 'Your cart',
  description: 'Review the items in your CasaCircuit cart.',
  robots: { index: false, follow: true },
}

export const dynamic = 'force-dynamic'

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default async function CartPage() {
  const cart = await getCartView()
  const env = getEnv()
  const freeShipping = env.FREE_SHIPPING_THRESHOLD

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Cart</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your cart
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {cart.totalItemCount === 0
              ? 'Nothing added yet.'
              : cart.totalItemCount === cart.itemCount
                ? `${cart.totalItemCount} item${cart.totalItemCount === 1 ? '' : 's'} ready to review.`
                : `${cart.totalItemCount} item${cart.totalItemCount === 1 ? '' : 's'} in your cart · ${cart.itemCount} available to order.`}
          </p>
        </div>
        {cart.items.length > 0 ? <ClearCartButton /> : null}
      </header>

      {cart.items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <ShoppingBag className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl font-semibold">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Browse the catalogue and add an option to your cart. Your cart is kept on this device
            for 30 days, with or without an account.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/products">
                Browse products
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/categories">Shop by category</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
          <section aria-label="Cart items" className="space-y-4">
            {cart.items.map((item) => (
              <article
                key={`${item.id}-${item.quantity}`}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                <Link
                  href={`/products/${item.productSlug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-secondary"
                >
                  {item.image ? (
                    <Image
                      src={item.image.url}
                      alt={item.image.alt}
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <ImageIcon className="size-6" aria-hidden="true" />
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-medium">
                        <Link href={`/products/${item.productSlug}`} className="hover:text-accent">
                          {item.productName}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.variantName} · <span className="font-mono">{item.sku}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {money.format(item.unitPrice)} each · inclusive of GST
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {money.format(item.lineTotal)}
                    </p>
                  </div>

                  {item.unavailableReason ? (
                    <p className="mt-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                      {item.unavailableReason} It is excluded from the total until it is available.
                    </p>
                  ) : item.stock <= 5 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Only {item.stock} left in stock.
                    </p>
                  ) : null}

                  <div className="mt-3">
                    <CartLineControls
                      itemId={item.id}
                      quantity={item.quantity}
                      maxQuantity={item.maxQuantity}
                    />
                  </div>
                </div>
              </article>
            ))}

            <p className="text-xs leading-6 text-muted-foreground">
              {cart.isGuest
                ? 'This cart is saved on this device. Sign in later and it will move to your account.'
                : 'This cart is saved to your account and follows you across devices.'}
            </p>
          </section>

          <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums">{money.format(cart.subtotal)}</dd>
              </div>
              {cart.discountTotal > 0 ? (
                <div className="flex justify-between gap-3 text-success">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{money.format(cart.discountTotal)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">GST included</dt>
                <dd className="text-muted-foreground tabular-nums">
                  {money.format(cart.taxTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="text-right text-xs text-muted-foreground">Calculated at checkout</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{money.format(cart.grandTotal)}</dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-border pt-4">
              <CouponForm activeCoupon={cart.coupon} />
            </div>

            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Free standard delivery above {money.format(freeShipping)}.
              Shipping is confirmed against your pincode at checkout.
            </p>

            <Button asChild size="lg" className="mt-5 w-full" disabled={cart.itemCount === 0}>
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  )
}
