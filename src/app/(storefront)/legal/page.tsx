import type { Metadata } from 'next'
import { ArrowRight, FileText, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

import { listPublicLegalDocuments } from '@/modules/legal/legal.public'

export const metadata: Metadata = {
  title: 'Legal policies',
  description:
    'The status of CasaCircuit terms, privacy, returns, shipping, warranty and grievance documents.',
  alternates: { canonical: '/legal' },
  robots: { index: false, follow: true },
}

export const dynamic = 'force-dynamic'

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(value)
}

export default async function LegalIndexPage() {
  const documents = await listPublicLegalDocuments()
  const inForceCount = documents.filter((document) => document.inForce).length

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Legal</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Policies and customer terms
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Every document below is tracked in the platform with an explicit version, effective date
          and legal review status. Draft text is never shown to customers.
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card p-5 text-sm leading-6">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="font-medium">
              {inForceCount === 0
                ? 'No policy is in force yet.'
                : `${inForceCount} of ${documents.length} policies are in force.`}
            </p>
            <p className="mt-1 text-muted-foreground">
              The remaining documents are unpublished drafts awaiting review by Indian counsel. They
              are not commitments, and the platform does not present them as such. Each page shows
              its exact status.
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
            Legal documents have not been initialised in this environment.
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {documents.map((document) => (
              <li key={document.slug}>
                <Link
                  href={`/legal/${document.slug}`}
                  className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-secondary/40"
                >
                  <span className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-medium">{document.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {document.inForce
                          ? `Version ${document.inForce.version} · in force from ${formatDate(document.inForce.effectiveAt)}`
                          : document.scheduledFor
                            ? `Published · takes effect ${formatDate(document.scheduledFor)}`
                            : 'Draft · not in force'}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        document.inForce
                          ? 'rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success'
                          : 'rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground'
                      }
                    >
                      {document.inForce ? 'In force' : 'Unpublished'}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-sm leading-6 text-muted-foreground">
          Questions about how a document will apply? Visit the{' '}
          <Link href="/faq" className="font-medium text-foreground underline underline-offset-2">
            frequently asked questions
          </Link>{' '}
          or the{' '}
          <Link
            href="/contact"
            className="font-medium text-foreground underline underline-offset-2"
          >
            contact page
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
