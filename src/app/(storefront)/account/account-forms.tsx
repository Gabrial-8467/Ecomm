'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import {
  changePasswordAction,
  logoutAction,
  revokeSessionAction,
  updateProfileAction,
  type ActionState,
} from '../auth-actions'

const initial: ActionState = { status: 'idle' }

function Notice({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null
  return (
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
  )
}

export interface ProfileView {
  firstName: string | null
  lastName: string | null
  preferredLanguage: string
  marketingOptIn: boolean
}

export function ProfileForm({ profile, csrfToken }: { profile: ProfileView; csrfToken: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <Notice state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="account-first-name" className="block text-sm font-medium">
            First name
          </label>
          <input
            id="account-first-name"
            name="firstName"
            defaultValue={profile.firstName ?? ''}
            autoComplete="given-name"
            maxLength={80}
            required
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="account-last-name" className="block text-sm font-medium">
            Last name
          </label>
          <input
            id="account-last-name"
            name="lastName"
            defaultValue={profile.lastName ?? ''}
            autoComplete="family-name"
            maxLength={80}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="account-language" className="block text-sm font-medium">
          Preferred language
        </label>
        <select
          id="account-language"
          name="preferredLanguage"
          defaultValue={profile.preferredLanguage}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">हिन्दी (भारत)</option>
        </select>
      </div>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={profile.marketingOptIn}
          className="mt-1 size-4 rounded border-input"
        />
        <span>Email me occasional product edits and offers. You can opt out at any time.</span>
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  )
}

export function PasswordForm({ csrfToken }: { csrfToken: string }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initial)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <Notice state={state} />
      <div className="space-y-2">
        <label htmlFor="account-current-password" className="block text-sm font-medium">
          Current password
        </label>
        <input
          id="account-current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="account-new-password" className="block text-sm font-medium">
          New password
        </label>
        <input
          id="account-new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          At least 10 characters. Other sessions are signed out when the password changes.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Updating…' : 'Change password'}
      </Button>
    </form>
  )
}

export interface SessionView {
  id: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  current: boolean
}

function formatWhen(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

function SessionRow({ session, csrfToken }: { session: SessionView; csrfToken: string }) {
  const [state, formAction, pending] = useActionState(revokeSessionAction, initial)

  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {session.current ? 'This device' : (session.userAgent?.slice(0, 80) ?? 'Unknown device')}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {session.ip ? `IP ${session.ip} · ` : ''}
          Last active {formatWhen(session.lastSeenAt)} · Signed in {formatWhen(session.createdAt)}
        </p>
        {state.status === 'error' ? (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {state.message}
          </p>
        ) : null}
      </div>
      <form action={formAction}>
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="sessionId" value={session.id} />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? 'Revoking…' : session.current ? 'Sign out' : 'Revoke'}
        </Button>
      </form>
    </li>
  )
}

export function SessionsList({
  sessions,
  csrfToken,
}: {
  sessions: SessionView[]
  csrfToken: string
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No active sessions.</p>
  }

  return (
    <ul>
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} csrfToken={csrfToken} />
      ))}
    </ul>
  )
}

export function SignOutButton({ csrfToken }: { csrfToken: string }) {
  return (
    <form action={logoutAction}>
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <Button type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  )
}
