import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react'

import { getCurrentActor } from '@/lib/auth/guards'
import { getEnv } from '@/lib/env'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | CasaCircuit Admin' },
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const NAV = [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentActor()
  if (!actor) redirect('/login?next=/admin')

  const env = getEnv()
  const mfaBlocked = actor.isStaff && env.ADMIN_MFA_REQUIRED && !actor.mfaEnabled

  if (!actor.isStaff) {
    return (
      <main className="container-page flex min-h-dvh max-w-xl flex-col justify-center py-12">
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="font-display text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is limited to CasaCircuit staff. Your customer account does not have access.
          </p>
          <Link
            href="/account"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to my account
          </Link>
        </div>
      </main>
    )
  }

  if (mfaBlocked) {
    return (
      <main className="container-page flex min-h-dvh max-w-xl flex-col justify-center py-12">
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="font-display text-2xl font-semibold">Two-step verification required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Staff accounts must enable an authenticator app before using the admin area. Sign in
            again and complete the setup step.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in again
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">CasaCircuit Admin</p>
              <p className="text-xs text-muted-foreground">
                {actor.email ?? 'Staff'} · {actor.roles.join(', ') || 'No role'}
              </p>
            </div>
          </div>
          <Link
            href="/account"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Account
          </Link>
        </div>
      </header>

      <div className="container-page flex flex-1 gap-8 py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="Admin" className="grid gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 px-3 text-xs text-muted-foreground">
            Additional modules appear as their phases ship.
          </p>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
