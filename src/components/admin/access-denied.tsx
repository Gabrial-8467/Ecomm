import Link from 'next/link'

export function AccessDenied({ permission }: { permission: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">403</p>
      <h1 className="mt-1 font-display text-2xl font-semibold">Access denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your role does not include <code className="font-mono text-xs">{permission}</code>. Ask a
        super administrator to review your permissions.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
