'use client'

import { useActionState } from 'react'

import { resetPasswordAction, type ActionState } from '../auth-actions'

const initial: ActionState = { status: 'idle' }

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial)

  if (state.status === 'success') {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold">Password updated</h1>
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
        <a
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign in
        </a>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This link can be used once. Signing in again will be required on all devices.
        </p>
      </div>

      <input type="hidden" name="token" value={token} />

      {state.status === 'error' ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="reset-password" className="block text-sm font-medium">
          New password
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
