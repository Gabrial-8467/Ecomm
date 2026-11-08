'use client'

import { ActionForm } from '@/components/admin/action-form'
import { Field, TextField, inputClass } from '@/components/admin/form-fields'
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/generated/prisma/client'
import { STAFF_NEXT_STATUSES, orderStatusLabel } from '@/modules/orders/order.service'

import { advanceOrderStatusAction, markOrderPaidAction } from '../actions'

export function OrderStatusActions({
  orderId,
  currentStatus,
  paymentStatus,
  paymentMethod,
  csrfToken,
}: {
  orderId: string
  currentStatus: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod | string | null
  csrfToken: string
}) {
  const allowedNext = STAFF_NEXT_STATUSES[currentStatus] ?? []
  const canMarkPaid = paymentMethod === 'COD' && paymentStatus !== 'PAID'

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-semibold">Fulfilment Actions</h3>
        <p className="text-xs text-muted-foreground">
          Advance order through verified fulfilment stages or reconcile collection.
        </p>
      </div>

      {allowedNext.length > 0 ? (
        <ActionForm
          action={advanceOrderStatusAction}
          submitLabel="Update Order Status"
          pendingLabel="Updating status…"
        >
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="orderId" value={orderId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Next Status">
              <select name="to" defaultValue={allowedNext[0]} className={inputClass} required>
                {allowedNext.map((status) => (
                  <option key={status} value={status}>
                    {orderStatusLabel(status)}
                  </option>
                ))}
              </select>
            </Field>

            <TextField
              label="Staff Note (Optional)"
              name="note"
              placeholder="e.g. Dispatched via Bluedart AWB-81923"
            />
          </div>
        </ActionForm>
      ) : (
        <p className="text-xs text-muted-foreground">
          No further status transitions available from {orderStatusLabel(currentStatus)}.
        </p>
      )}

      {canMarkPaid ? (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cash on Delivery Reconciliation
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Mark payment as collected by delivery agent and advance order to confirmed if pending.
          </p>
          <ActionForm
            action={markOrderPaidAction}
            submitLabel="Mark Cash Collected"
            pendingLabel="Recording payment…"
            className="mt-3"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="orderId" value={orderId} />
            <TextField
              label="Collection / Cash Reference"
              name="reference"
              placeholder="e.g. COD-DELHI-RECEIPT-492"
              required
            />
          </ActionForm>
        </div>
      ) : null}
    </div>
  )
}
