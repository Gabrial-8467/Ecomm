'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  removeCartItemAction,
  updateCartItemAction,
  type CartActionState,
} from '@/app/(storefront)/cart-actions'
import { Button } from '@/components/ui/button'

const initialState: CartActionState = { status: 'idle' }

function UpdateButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={!dirty || pending}>
      {pending ? 'Updating…' : 'Update'}
    </Button>
  )
}

function RemoveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
      {pending ? 'Removing…' : 'Remove'}
    </button>
  )
}

export function CartLineControls({
  itemId,
  quantity,
  maxQuantity,
}: {
  itemId: string
  quantity: number
  maxQuantity: number
}) {
  const [nextQuantity, setNextQuantity] = useState(quantity)
  const [state, updateAction] = useActionState(updateCartItemAction, initialState)
  const [removeState, removeAction] = useActionState(removeCartItemAction, initialState)
  const dirty = nextQuantity !== quantity

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <form action={updateAction} className="flex items-center gap-2">
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="quantity" value={nextQuantity} />
          <div className="flex items-center rounded-md border border-input">
            <button
              type="button"
              onClick={() => setNextQuantity((value) => Math.max(1, value - 1))}
              disabled={nextQuantity <= 1}
              aria-label="Decrease quantity"
              className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </button>
            <span className="w-9 text-center text-sm tabular-nums">{nextQuantity}</span>
            <button
              type="button"
              onClick={() => setNextQuantity((value) => Math.min(maxQuantity, value + 1))}
              disabled={nextQuantity >= maxQuantity}
              aria-label="Increase quantity"
              className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <UpdateButton dirty={dirty} />
        </form>

        <form action={removeAction}>
          <input type="hidden" name="itemId" value={itemId} />
          <RemoveButton />
        </form>
      </div>

      {state.status === 'error' || removeState.status === 'error' ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message ?? removeState.message}
        </p>
      ) : null}
      {state.status === 'success' && !dirty ? (
        <p role="status" className="text-xs text-success">
          {state.message}
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
