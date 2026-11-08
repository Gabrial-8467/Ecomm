'use client'

import { AlertCircle, Package, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'

import { trackGuestOrderAction, type OrderActionState } from '@/app/(storefront)/orders/order-actions'
import { Button } from '@/components/ui/button'

const initialState: OrderActionState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? (
        'Finding your order…'
      ) : (
        <>
          <Search className="size-4 mr-2" aria-hidden="true" />
          Track Order
        </>
      )}
    </Button>
  )
}

export function TrackOrderForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(trackGuestOrderAction, initialState)

  useEffect(() => {
    if (state.status === 'success' && state.redirectUrl) {
      router.push(state.redirectUrl)
    }
  }, [state, router])

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 shadow-xs sm:p-8">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Package className="size-6" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-center font-display text-xl font-bold tracking-tight">
        Track Your Shipment
      </h2>
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        Enter the order number and email or phone number you used during checkout.
      </p>

      {state.status === 'error' && state.message ? (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="orderNumber" className="block text-xs font-medium text-foreground">
            Order Reference Number *
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            type="text"
            placeholder="e.g. CC-261108-A1B2C3"
            required
            autoCapitalize="characters"
            className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm uppercase focus:outline-hidden focus:ring-1 focus:ring-ring"
          />
          <p className="text-[11px] text-muted-foreground">Found in your order confirmation email or SMS.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact" className="block text-xs font-medium text-foreground">
            Email or 10-digit Phone Number *
          </label>
          <input
            id="contact"
            name="contact"
            type="text"
            placeholder="e.g. priya@example.com or 9876543210"
            required
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
