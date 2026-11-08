import { ArrowRight, Clock3, PackageSearch, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

const WORKING_LINKS = [
  { href: '/products', label: 'Browse all products' },
  { href: '/categories', label: 'Shop by category' },
  { href: '/brands', label: 'Brands we stock' },
  { href: '/account', label: 'Your account' },
]

/**
 * Honest holding page for routes that are linked from the storefront but not
 * implemented yet. It never invents policies, delivery promises or company
 * details; it points people at functionality that is actually live.
 */
export function StatusPage({
  eyebrow = 'Not live yet',
  title,
  description,
  notes = [],
  primaryHref = '/products',
  primaryLabel = 'Browse the catalogue',
  secondaryHref,
  secondaryLabel,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  notes?: string[]
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  children?: ReactNode
}) {
  return (
    <div className="container-page py-12 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          <Clock3 className="size-4" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>

        {notes.length > 0 ? (
          <ul className="mt-6 space-y-3 rounded-xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
            {notes.map((note) => (
              <li key={note} className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button asChild variant="outline">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>

        {children}

        <section aria-labelledby="working-now" className="mt-12 border-t border-border pt-8">
          <h2
            id="working-now"
            className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase"
          >
            <PackageSearch className="size-4 text-accent" aria-hidden="true" />
            Working now
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {WORKING_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-accent/60 hover:text-accent"
                >
                  {link.label}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
