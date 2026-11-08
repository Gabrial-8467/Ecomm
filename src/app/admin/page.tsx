import type { Metadata } from 'next'
import Link from 'next/link'

import { getCurrentActor } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'

export const metadata: Metadata = { title: 'Dashboard' }

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const actor = await getCurrentActor()

  if (!actor || !hasPermission(actor.permissions, 'dashboard:read')) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">403</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role does not include dashboard access. Ask a super administrator to review your
          permissions.
        </p>
        <Link
          href="/account"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to my account
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Dashboard
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Operations overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {actor.email ?? actor.userId} with roles {actor.roles.join(', ')}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Session type</p>
          <p className="mt-1 text-sm font-medium">Staff ({actor.sessionId.slice(0, 12)}…)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Permissions</p>
          <p className="mt-1 text-sm font-medium">
            {actor.isSuperAdmin ? 'All permissions' : `${actor.permissions.length} granted`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Two-step verification</p>
          <p className="mt-1 text-sm font-medium">{actor.mfaEnabled ? 'Enabled' : 'Not enabled'}</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Coming in later phases</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Catalog, inventory, orders, returns, CMS and reporting modules will appear here as they
          are implemented and tested. This dashboard intentionally shows no invented metrics.
        </p>
      </section>
    </div>
  )
}
