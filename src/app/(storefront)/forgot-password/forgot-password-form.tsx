'use client'

import { useActionState } from 'react'

import { forgotPasswordAction, type ActionState } from '../auth-actions'

const initial: ActionState = { status: 'idle' }

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initial)

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email address and we will send a single-use reset link.
        </p>
      </div>

      {state.status !== 'idle' ? (
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

      <div className="space-y-2">
        <label htmlFor="forgot-email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </button>

      <p className="text-sm text-muted-foreground">
        <a href="/login" className="font-medium text-accent underline underline-offset-4">
          Back to sign in
        </a>
      </p>
    </form>
  )
}
