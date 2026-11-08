'use client'

import { Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { clearCartAction, type CartActionState } from '@/app/(storefront)/cart-actions'

const initialState: CartActionState = { status: 'idle' }

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
      {pending ? 'Clearing…' : 'Clear cart'}
    </button>
  )
}

export function ClearCartButton() {
  const [state, formAction] = useActionState(clearCartAction, initialState)
  return (
    <form action={formAction}>
      <Submit />
      {state.status === 'error' ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
