'use client'

import { useActionState } from 'react'

import { resendVerificationAction, type ActionState } from './auth-actions'

const initial: ActionState = { status: 'idle' }

export function ResendVerificationForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initial)

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Need a new verification link? Enter the address you registered with.
      </p>
      <div className="space-y-2">
        <label htmlFor="resend-verification-email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="resend-verification-email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          autoComplete="email"
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
      </div>
      {state.status !== 'idle' && state.message ? (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={
            state.status === 'error'
              ? 'rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'
              : 'rounded-md bg-success/10 px-3 py-2 text-sm text-success'
          }
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-transparent px-4 text-sm font-medium hover:bg-secondary disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Resend verification email'}
      </button>
    </form>
  )
}
