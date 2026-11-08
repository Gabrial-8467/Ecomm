'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'

import { loginAction, type ActionState } from '../auth-actions'
import { ResendVerificationForm } from '../resend-verification-form'

const initial: ActionState = { status: 'idle' }

function ErrorMessage({ state }: { state: ActionState }) {
  if (state.status !== 'error' && state.status !== 'mfa') return null
  return (
    <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.message}
    </p>
  )
}

function MfaSetup({ challengeToken }: { challengeToken: string }) {
  const router = useRouter()
  const [setup, setSetup] = useState<{
    secret: string
    otpauthUrl: string
    recoveryCodes: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function startSetup() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken }),
      })
      const body = (await response.json()) as {
        secret?: string
        otpauthUrl?: string
        recoveryCodes?: string[]
        message?: string
      }
      if (!response.ok || !body.secret || !body.otpauthUrl) {
        setError(body.message ?? 'Could not start authenticator setup.')
        return
      }
      setSetup({
        secret: body.secret,
        otpauthUrl: body.otpauthUrl,
        recoveryCodes: body.recoveryCodes ?? [],
      })
    } catch {
      setError('Could not start authenticator setup. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function enable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/v1/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken,
          code: formData.get('code'),
        }),
      })
      const body = (await response.json()) as { message?: string }
      if (!response.ok) {
        setError(body.message ?? 'That code is not valid.')
        return
      }
      router.push('/account')
      router.refresh()
    } catch {
      setError('Could not verify the code. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!setup) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Staff accounts must use an authenticator app. Have your phone ready, then start setup.
        </p>
        {error ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={startSetup}
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Preparing…' : 'Set up authenticator'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add this secret to your authenticator app, or open the provisioning link on the device.
      </p>
      <div className="rounded-md border border-border bg-secondary/40 p-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Secret</p>
        <code className="mt-1 block font-mono text-sm break-all">{setup.secret}</code>
      </div>
      <a
        href={setup.otpauthUrl}
        className="text-sm font-medium text-accent underline underline-offset-4"
      >
        Open provisioning link
      </a>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        <p className="font-medium">Save these recovery codes now.</p>
        <p className="mt-1 text-xs">Each code can be used once if you lose access to the app.</p>
        <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
          {setup.recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </div>

      <form onSubmit={enable} className="space-y-3">
        <label htmlFor="mfa-setup-code" className="block text-sm font-medium">
          6-digit code from your app
        </label>
        <input
          id="mfa-setup-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Enable and sign in'}
        </button>
      </form>
    </div>
  )
}

function MfaChallenge({ challengeToken }: { challengeToken: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken, code: formData.get('code') }),
      })
      const body = (await response.json()) as { message?: string }
      if (!response.ok) {
        setError(body.message ?? 'That code is not valid.')
        return
      }
      router.push('/account')
      router.refresh()
    } catch {
      setError('Could not verify the code. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app. A recovery code also works.
      </p>
      <label htmlFor="mfa-code" className="block text-sm font-medium">
        Authentication code
      </label>
      <input
        id="mfa-code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        minLength={6}
        maxLength={20}
        required
        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
      />
      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Verifying…' : 'Verify and sign in'}
      </button>
    </form>
  )
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial)
  const [email, setEmail] = useState('')

  if (state.status === 'mfa' && state.challengeToken) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">Two-step verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
        </div>
        {state.setupRequired ? (
          <MfaSetup challengeToken={state.challengeToken} />
        ) : (
          <MfaChallenge challengeToken={state.challengeToken} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your orders, addresses and account settings.
          </p>
        </div>

        <ErrorMessage state={state} />

        <div className="space-y-2">
          <label htmlFor="login-email" className="block text-sm font-medium">
            Email address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="login-password" className="block text-sm font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-accent underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-sm text-muted-foreground">
          New to CasaCircuit?{' '}
          <Link href="/register" className="font-medium text-accent underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </form>

      {state.code === 'EMAIL_NOT_VERIFIED' ? (
        <div className="border-t border-border pt-5">
          <ResendVerificationForm defaultEmail={email} />
        </div>
      ) : null}
    </div>
  )
}
