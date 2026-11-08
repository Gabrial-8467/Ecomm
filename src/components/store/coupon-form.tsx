'use client'

import { Tag, X } from 'lucide-react'
import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'

import {
  applyCouponAction,
  removeCouponAction,
  type CartActionState,
} from '@/app/(storefront)/cart-actions'
import { Button } from '@/components/ui/button'

const initialState: CartActionState = { status: 'idle' }

function ApplySubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending} className="shrink-0">
      {pending ? 'Applying…' : 'Apply'}
    </Button>
  )
}

function RemoveSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Remove coupon"
      className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  )
}

export function CouponForm({
  activeCoupon,
}: {
  activeCoupon?: { code: string; discount: number; freeShipping: boolean; reason: string | null } | null
}) {
  const [applyState, applyAction] = useActionState(applyCouponAction, initialState)
  const [removeState, removeAction] = useActionState(removeCouponAction, initialState)

  useEffect(() => {
    if (applyState.status === 'success' && applyState.message) {
      toast.success(applyState.message)
    } else if (applyState.status === 'error' && applyState.message) {
      toast.error(applyState.message)
    }
  }, [applyState])

  useEffect(() => {
    if (removeState.status === 'success' && removeState.message) {
      toast.info(removeState.message)
    } else if (removeState.status === 'error' && removeState.message) {
      toast.error(removeState.message)
    }
  }, [removeState])

  if (activeCoupon) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-success shrink-0" aria-hidden="true" />
            <span className="font-mono text-sm font-semibold text-success uppercase">
              {activeCoupon.code}
            </span>
          </div>
          <form action={removeAction}>
            <RemoveSubmit />
          </form>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {activeCoupon.freeShipping
            ? 'Free standard delivery applied.'
            : `Coupon applied: ₹${activeCoupon.discount.toFixed(2)} off.`}
        </p>
      </div>
    )
  }

  return (
    <form action={applyAction} className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            name="code"
            placeholder="Coupon code"
            required
            autoCapitalize="characters"
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 font-mono text-xs uppercase tracking-wider focus:outline-hidden focus:ring-1 focus:ring-ring"
          />
        </div>
        <ApplySubmit />
      </div>
      {applyState.status === 'error' ? (
        <p role="alert" className="text-xs text-destructive">
          {applyState.message}
        </p>
      ) : null}
    </form>
  )
}
