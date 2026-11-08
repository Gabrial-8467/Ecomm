import type { Metadata } from 'next'
import { ArrowLeft, FileClock, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

import { LegalContent } from '@/components/marketing/legal-content'
import { Button } from '@/components/ui/button'
import { getPublicLegalDocument } from '@/modules/legal/legal.public'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(value)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const document = await getPublicLegalDocument(slug)

  if (!document) {
    return {
      title: 'Legal document not available',
      robots: { index: false, follow: true },
    }
  }

  if (!document.inForce) {
    return {
      title: `${document.title} — unpublished`,
      description: `The ${document.title} for CasaCircuit is not in force yet.`,
      alternates: { canonical: `/legal/${document.slug}` },
      robots: { index: false, follow: true },
    }
  }

  return {
    title: document.title,
    description: `The current ${document.title} for CasaCircuit, version ${document.inForce.version}.`,
    alternates: { canonical: `/legal/${document.slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function LegalDocumentPage({ params }: PageProps) {
  const { slug } = await params
  const document = await getPublicLegalDocument(slug)

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/legal"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All legal documents
        </Link>

        {!document ? (
          <section className="mt-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Legal</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              This document is not available.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              No legal document exists at this address. The document may have been renamed or not
              yet initialised in this environment.
            </p>
            <Button asChild className="mt-7">
              <Link href="/legal">View all legal documents</Link>
            </Button>
          </section>
        ) : document.inForce ? (
          <article className="mt-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Legal</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {document.title}
            </h1>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <div className="flex gap-1.5">
                <dt className="font-medium text-foreground">Version</dt>
                <dd>{document.inForce.version}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="font-medium text-foreground">In force from</dt>
                <dd>{formatDate(document.inForce.effectiveAt)}</dd>
              </div>
            </dl>

            <div className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8">
              <LegalContent content={document.inForce.content} />
            </div>

            {document.scheduledFor ? (
              <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                <FileClock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />A
                later version has already been published and takes effect on{' '}
                {formatDate(document.scheduledFor)}.
              </p>
            ) : null}
          </article>
        ) : (
          <section className="mt-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Legal</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {document.title}
            </h1>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-card p-5 text-sm leading-6">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-medium">
                  {document.scheduledFor
                    ? 'This document is not in force yet.'
                    : 'This document is an unpublished draft.'}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {document.scheduledFor
                    ? `A version has been published and takes effect on ${formatDate(document.scheduledFor)}. Until then, no version of this document is in force.`
                    : 'It is awaiting review by Indian counsel. The draft text is intentionally not shown and must not be relied on as a policy.'}
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              In the meantime, the{' '}
              <Link
                href="/faq"
                className="font-medium text-foreground underline underline-offset-2"
              >
                FAQ
              </Link>{' '}
              describes what is and is not live on the platform today.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/legal">View all legal documents</Link>
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}
