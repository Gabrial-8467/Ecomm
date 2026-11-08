'use client'

import { useActionState } from 'react'

import { verifyEmailAction, type ActionState } from '../auth-actions'

const initial: ActionState = { status: 'idle' }

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(verifyEmailAction, initial)

  if (state.status === 'success') {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold">Email verified</h1>
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
        <h1 className="font-display text-2xl font-semibold">Verify your email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm this address to activate your CasaCircuit account.
        </p>
      </div>

      <input type="hidden" name="token" value={token} />

      {state.status === 'error' ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      {!token ? (
        <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-foreground">
          This link is missing its verification token. Request a new link from the sign-in page.
        </p>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Verifying…' : 'Verify email'}
        </button>
      )}
    </form>
  )
}
