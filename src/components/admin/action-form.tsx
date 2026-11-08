'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import type { ActionResult } from '@/lib/admin/action-result'
import { cn } from '@/lib/utils'

export type ActionFormAction = (state: ActionResult, formData: FormData) => Promise<ActionResult>

export function ActionForm({
  action,
  children,
  submitLabel = 'Save',
  pendingLabel = 'Saving…',
  className,
  compact = false,
}: {
  action: ActionFormAction
  children: React.ReactNode
  submitLabel?: string
  pendingLabel?: string
  className?: string
  compact?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' } as ActionResult)

  return (
    <form action={formAction} className={cn('grid gap-4', className)}>
      {children}
      {state.status === 'error' ? (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive">{state.message}</p>
          {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-destructive">
              {Object.entries(state.fieldErrors).map(([field, message]) => (
                <li key={field}>
                  <span className="font-medium">{field}:</span> {message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {state.status === 'success' && state.message ? (
        <p role="status" className="rounded-md border border-success/30 bg-success/5 p-3 text-sm">
          {state.message}
        </p>
      ) : null}
      <div className={compact ? '' : 'flex items-center gap-3'}>
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}
