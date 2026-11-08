'use client'

import { Check, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { addToCartAction, type CartActionState } from '@/app/(storefront)/cart-actions'
import { Button } from '@/components/ui/button'

const initialState: CartActionState = { status: 'idle' }

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled || pending}>
      <ShoppingBag aria-hidden="true" />
      {pending ? 'Adding…' : 'Add to cart'}
    </Button>
  )
}

export function AddToCartForm({
  variantId,
  maxQuantity,
}: {
  variantId: string | null
  maxQuantity: number
}) {
  const [state, formAction] = useActionState(addToCartAction, initialState)
  const cap = Math.max(1, maxQuantity)
  const disabled = !variantId || maxQuantity < 1

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="variantId" value={variantId ?? ''} />

      {!disabled ? (
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="quantity" className="text-sm font-medium">
            Quantity
          </label>
          <select
            id="quantity"
            name="quantity"
            defaultValue={1}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {Array.from({ length: cap }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <SubmitButton disabled={disabled} />

      {disabled ? (
        <p className="text-center text-xs text-muted-foreground">
          This option is currently out of stock.
        </p>
      ) : null}

      {state.status === 'error' ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      {state.status === 'success' ? (
        <p
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          <Check className="size-4" aria-hidden="true" />
          {state.message}
          <Link href="/cart" className="font-medium underline underline-offset-2">
            View cart
          </Link>
        </p>
      ) : null}
    </form>
  )
}
