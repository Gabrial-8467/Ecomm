'use client'

import { useActionState } from 'react'

import { registerAction, type ActionState } from '../auth-actions'

const initial: ActionState = { status: 'idle' }

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial)

  if (state.status === 'success') {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold">Check your email</h1>
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
        <a
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to sign in
        </a>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save addresses, track orders and manage returns in one place.
        </p>
      </div>

      {state.status === 'error' ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="register-first-name" className="block text-sm font-medium">
            First name
          </label>
          <input
            id="register-first-name"
            name="firstName"
            autoComplete="given-name"
            maxLength={80}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="register-last-name" className="block text-sm font-medium">
            Last name
          </label>
          <input
            id="register-last-name"
            name="lastName"
            autoComplete="family-name"
            maxLength={80}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="register-email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="register-password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use at least 10 characters. Avoid common passwords and your email address.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="marketingOptIn" className="mt-1 size-4 rounded border-input" />
        <span>Email me occasional product edits and offers. You can opt out at any time.</span>
      </label>

      <div aria-hidden="true" className="hidden">
        <label htmlFor="register-company">Company</label>
        <input id="register-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-xs text-muted-foreground">
        By creating an account you agree to our{' '}
        <a href="/legal/terms" className="underline underline-offset-4">
          terms
        </a>{' '}
        and{' '}
        <a href="/legal/privacy" className="underline underline-offset-4">
          privacy policy
        </a>
        . These documents are draft placeholders pending legal review.
      </p>

      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-accent underline underline-offset-4">
          Sign in
        </a>
      </p>
    </form>
  )
}
