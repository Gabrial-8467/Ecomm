'use client'

import { useActionState, useState } from 'react'
import { RotateCcw } from 'lucide-react'

import { requestCustomerReturnAction, type OrderActionState } from '@/app/(storefront)/orders/order-actions'
import { Button } from '@/components/ui/button'

interface ReturnableItem {
  id: string
  productName: string
  variantTitle: string
  quantity: number
}

export function ReturnRequestButton({
  orderNumber,
  items,
}: {
  orderNumber: string
  items: ReturnableItem[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(requestCustomerReturnAction, {
    status: 'idle',
  } as OrderActionState)

  const showForm = isOpen && state.status !== 'success'

  if (state.status === 'success') {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
        <p className="font-semibold">Return request submitted</p>
        <p className="mt-1 text-xs">{state.message}</p>
      </div>
    )
  }

  if (!showForm) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5"
      >
        <RotateCcw className="size-4" />
        Request Return / Replacement
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold">Request Return / Replacement</h3>
          <p className="text-xs text-muted-foreground">
            Per Consumer Protection Rules, return requests are acknowledged within 48 hours.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>

      <form action={formAction} className="mt-4 space-y-4 text-xs">
        <input type="hidden" name="orderNumber" value={orderNumber} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="font-medium text-foreground">Select Item to Return</span>
            <select
              name="orderItemId"
              defaultValue={items[0]?.id}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
              required
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productName} ({item.variantTitle}) · Qty: {item.quantity}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="font-medium text-foreground">Return Reason</span>
            <select
              name="reason"
              defaultValue="DEFECTIVE"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="DEFECTIVE">Defective / Not functioning</option>
              <option value="DAMAGED">Damaged in transit</option>
              <option value="WRONG_ITEM">Wrong item received</option>
              <option value="MISSING_PARTS">Missing accessories / parts</option>
              <option value="NOT_AS_DESCRIBED">Item not as described</option>
              <option value="SIZE_FIT">Size / Dimensions unfit</option>
              <option value="CHANGED_MIND">Changed mind</option>
              <option value="OTHER">Other issue</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="font-medium text-foreground">Item Condition</span>
            <select
              name="condition"
              defaultValue="OPENED"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="OPENED">Opened but intact</option>
              <option value="UNOPENED">Unopened in original seal</option>
              <option value="DAMAGED">Damaged / Broken</option>
              <option value="DEFECTIVE">Defective upon first test</option>
              <option value="MISSING_PARTS">Missing parts or screws</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="font-medium text-foreground">Quantity to Return</span>
            <input
              type="number"
              name="quantity"
              defaultValue="1"
              min="1"
              max="10"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="font-medium text-foreground">Description of the Issue</span>
          <textarea
            name="description"
            rows={3}
            placeholder="Please explain why you wish to return this product in detail…"
            className="w-full rounded-md border border-input bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            required
          />
        </label>

        {state.status === 'error' && state.message ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-destructive">
            {state.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Submitting…' : 'Submit Return Request'}
          </Button>
        </div>
      </form>
    </div>
  )
}
