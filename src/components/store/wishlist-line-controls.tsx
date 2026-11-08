'use client'

import { ShoppingBag, Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  moveWishlistItemToCartAction,
  removeWishlistItemAction,
  type WishlistActionState,
} from '@/app/(storefront)/wishlist-actions'
import { Button } from '@/components/ui/button'

const initialState: WishlistActionState = { status: 'idle' }

function SubmitButton({
  icon,
  label,
  pendingLabel,
  variant = 'default',
  disabled = false,
}: {
  icon: React.ReactNode
  label: string
  pendingLabel: string
  variant?: 'default' | 'outline'
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending || disabled}>
      {icon}
      {pending ? pendingLabel : label}
    </Button>
  )
}

export function WishlistLineControls({
  itemId,
  available,
}: {
  itemId: string
  available: boolean
}) {
  const [cartState, cartAction] = useActionState(moveWishlistItemToCartAction, initialState)
  const [removeState, removeAction] = useActionState(removeWishlistItemAction, initialState)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={cartAction}>
          <input type="hidden" name="itemId" value={itemId} />
          <SubmitButton
            icon={<ShoppingBag className="size-4" aria-hidden="true" />}
            label="Add to cart"
            pendingLabel="Adding…"
            disabled={!available}
          />
        </form>
        <form action={removeAction}>
          <input type="hidden" name="itemId" value={itemId} />
          <SubmitButton
            variant="outline"
            icon={<Trash2 className="size-4" aria-hidden="true" />}
            label="Remove"
            pendingLabel="Removing…"
          />
        </form>
      </div>

      {!available ? (
        <p className="text-xs text-muted-foreground">
          This product is currently unavailable and cannot be added to the cart.
        </p>
      ) : null}

      {cartState.status === 'error' || removeState.status === 'error' ? (
        <p role="alert" className="text-xs text-destructive">
          {cartState.message ?? removeState.message}
        </p>
      ) : null}
      {cartState.status === 'success' ? (
        <p role="status" className="text-xs text-success">
          {cartState.message}
        </p>
      ) : null}
      {removeState.status === 'success' ? (
        <p role="status" className="text-xs text-success">
          {removeState.message}
        </p>
      ) : null}
    </div>
  )
}
