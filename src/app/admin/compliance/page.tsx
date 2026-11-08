import type { Metadata } from 'next'
import { FileCheck2, Scale, Shield } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { AdminPageHeader } from '@/components/admin/form-fields'
import { getCurrentActor } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Compliance & Grievance Portal' }
export const dynamic = 'force-dynamic'

export default async function AdminCompliancePage() {
  const actor = await getCurrentActor()
  const canRead =
    actor &&
    (actor.isSuperAdmin ||
      hasPermission(actor.permissions, 'grievances:read') ||
      hasPermission(actor.permissions, 'privacy:read') ||
      hasPermission(actor.permissions, 'audit:read'))

  if (!canRead) {
    return <AccessDenied permission="grievances:read" />
  }

  const [tickets, documents, auditLogs] = await Promise.all([
    prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.legalDocument.findMany({
      include: {
        versions: {
          orderBy: { effectiveAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Statutory Compliance & Grievances"
        description="Monitor Consumer Protection E-Commerce Rules (48h/1-month SLAs), DPDP compliance, and immutable audit logs."
      />

      {/* SLA summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Consumer Protection SLA</p>
          <p className="mt-1 font-semibold text-foreground">48h Ack / 1-Month Resolution</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Rule 5(3)(b) Consumer Protection (E-Commerce) Rules
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Legal Documents</p>
          <p className="mt-1 font-semibold text-foreground">{documents.length} Policy Documents</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Versioned & Cryptographically Hashed</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">DPDP Consent Mechanism</p>
          <p className="mt-1 font-semibold text-foreground">Opt-in Consent & Erasure Logged</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Digital Personal Data Protection Act, 2023</p>
        </div>
      </div>

      {/* Grievances & Support Tickets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Scale className="size-4 text-accent" />
              Customer Grievances & Support Requests
            </h2>
            <p className="text-xs text-muted-foreground">
              Formal tickets subject to Consumer Protection acknowledgement deadlines.
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{tickets.length} tickets</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Ticket #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-xs">
                    No active support tickets or grievances filed.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-medium">{t.ticketNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{t.subject}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.slaAckDueAt ? (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          Ack by:{' '}
                          {new Date(t.slaAckDueAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      ) : (
                        'Standard'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Statutory Legal Documents Registry */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <FileCheck2 className="size-4 text-accent" />
            Statutory Legal Documents & Policies
          </h2>
          <p className="text-xs text-muted-foreground">
            Current versioning, legal review sign-off state, and consent requirements.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Current Version</th>
                <th className="px-4 py-3">Legal Review Status</th>
                <th className="px-4 py-3">Requires Consent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => {
                const latestVersion = doc.versions[0]
                return (
                  <tr key={doc.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{doc.title}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{doc.slug}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {latestVersion ? `v${latestVersion.version}` : 'No version'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          latestVersion?.legalReviewStatus === 'REVIEWED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {latestVersion?.legalReviewStatus ?? 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.requiresConsent ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Immutable Audit Logs */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Shield className="size-4 text-accent" />
            Security & Compliance Audit Trail
          </h2>
          <p className="text-xs text-muted-foreground">
            Immutable log of staff operations, authentication modifications, and privilege grants.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-border bg-muted/40 font-sans font-medium text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground font-sans text-xs">
                    No security audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.entityType}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.entityId ?? '—'}</td>
                    <td className="px-4 py-3">{log.actorId ?? 'SYSTEM'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.ip ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
