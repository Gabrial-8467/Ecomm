import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { csrfTokenForForm, getCurrentSession } from '@/lib/auth/guards'
import { getAccountProfile, listSessionsForActor } from '@/modules/auth'

import {
  PasswordForm,
  ProfileForm,
  SessionsList,
  SignOutButton,
  type SessionView,
} from './account-forms'

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function maskIdentity(value: string | null): string {
  if (!value) return 'Not added'
  if (!value.includes('@')) {
    return value.length > 4 ? `${'*'.repeat(value.length - 4)}${value.slice(-4)}` : '••••'
  }
  const [local, domain] = value.split('@')
  if (!domain || !local) return 'Not added'
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`
}

export default async function AccountPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  const [profile, sessions, csrfToken] = await Promise.all([
    getAccountProfile(session.actor),
    listSessionsForActor(session.actor),
    csrfTokenForForm(session.kind),
  ])

  const sessionViews: SessionView[] = sessions.map((item) => ({
    id: item.id,
    ip: item.ip,
    userAgent: item.userAgent,
    createdAt: item.createdAt.toISOString(),
    lastSeenAt: item.lastSeenAt.toISOString(),
    expiresAt: item.expiresAt.toISOString(),
    current: item.current,
  }))

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your account'

  return (
    <div className="container-page max-w-4xl py-10">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Account
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{maskIdentity(profile.email)}</p>
        </div>
        <SignOutButton csrfToken={csrfToken} />
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="mt-1 text-sm font-medium">
            {profile.emailVerifiedAt ? 'Verified' : 'Verification pending'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Mobile</p>
          <p className="mt-1 text-sm font-medium">
            {profile.phone
              ? profile.phoneVerifiedAt
                ? 'Verified'
                : 'Verification pending'
              : 'Not added'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Two-step verification</p>
          <p className="mt-1 text-sm font-medium">
            {profile.mfaEnabled ? 'Enabled' : 'Not enabled'}
          </p>
        </div>
      </div>

      <section aria-labelledby="account-profile" className="mt-10">
        <h2 id="account-profile" className="font-display text-xl font-semibold">
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These details appear on invoices and delivery paperwork.
        </p>
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <ProfileForm
            profile={{
              firstName: profile.firstName,
              lastName: profile.lastName,
              preferredLanguage: profile.preferredLanguage,
              marketingOptIn: profile.marketingOptIn,
            }}
            csrfToken={csrfToken}
          />
        </div>
      </section>

      <section aria-labelledby="account-password" className="mt-10">
        <h2 id="account-password" className="font-display text-xl font-semibold">
          Password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.hasPassword
            ? 'Use a unique password you do not use anywhere else.'
            : 'Your account signs in with a mobile code. Set a password to add email sign-in.'}
        </p>
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <PasswordForm csrfToken={csrfToken} />
        </div>
      </section>

      <section aria-labelledby="account-sessions" className="mt-10">
        <h2 id="account-sessions" className="font-display text-xl font-semibold">
          Active sessions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revoke any device you do not recognise. Revoking this device signs you out.
        </p>
        <div className="mt-4 rounded-xl border border-border bg-card px-5">
          <SessionsList sessions={sessionViews} csrfToken={csrfToken} />
        </div>
      </section>
    </div>
  )
}
