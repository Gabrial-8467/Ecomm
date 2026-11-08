'use client'

import { AlertTriangle, XCircle } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'

import {
  cancelCustomerOrderAction,
  type OrderActionState,
} from '@/app/(storefront)/orders/order-actions'
import { Button } from '@/components/ui/button'

const initialState: OrderActionState = { status: 'idle' }

function CancelSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      {pending ? 'Cancelling order…' : 'Confirm cancellation'}
    </Button>
  )
}

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [state, formAction] = useActionState(cancelCustomerOrderAction, initialState)

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
    } else if (state.status === 'error' && state.message) {
      toast.error(state.message)
    }
  }, [state])

  const showForm = isOpen && state.status !== 'success'

  if (!showForm) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
      >
        <XCircle className="size-4 mr-1.5" aria-hidden="true" />
        Cancel this order
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs">
      <div className="flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <span>Are you sure you want to cancel this order?</span>
      </div>
      <p className="mt-1 text-muted-foreground">
        Reserved items will be returned to stock. If paid online, a full refund will be processed to your original payment method.
      </p>

      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="orderNumber" value={orderNumber} />
        <div>
          <label htmlFor="cancel-reason" className="block text-xs font-medium text-foreground">
            Reason for cancellation (optional)
          </label>
          <input
            id="cancel-reason"
            name="reason"
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
            placeholder="e.g. Changed my mind, found a different product"
            maxLength={200}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <CancelSubmit />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Keep order
          </Button>
        </div>
      </form>
    </div>
  )
}
