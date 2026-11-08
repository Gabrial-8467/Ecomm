import type { Metadata } from 'next'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getCheckoutView } from '@/modules/checkout/checkout.service'

import { CheckoutForm } from './checkout-form'

export const metadata: Metadata = {
  title: 'Secure Checkout | CasaCircuit',
  description: 'Complete your purchase with address and payment options.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const view = await getCheckoutView()

  if (!view || view.cart.itemCount === 0) {
    return (
      <div className="container-page py-16 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
          <ShoppingBag className="size-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have any available items in your cart to checkout.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/cart">
              <ArrowLeft className="size-4 mr-2" aria-hidden="true" />
              Return to cart
            </Link>
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
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              CasaCircuit Checkout
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Shipping & Payment
            </h1>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/cart">
              <ArrowLeft className="size-4 mr-2" aria-hidden="true" />
              Back to cart
            </Link>
          </Button>
        </div>
      </header>

      <CheckoutForm initialView={view} />
    </div>
  )
}
