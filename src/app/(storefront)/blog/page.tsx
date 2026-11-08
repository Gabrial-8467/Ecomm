import type { Metadata } from 'next'

import { NewsletterForm } from '@/components/marketing/newsletter-form'
import { StatusPage } from '@/components/marketing/status-page'

export const metadata: Metadata = {
  title: 'Journal',
  description: 'The CasaCircuit journal is not published yet.',
  robots: { index: false, follow: true },
}

export default function BlogPage() {
  return (
    <StatusPage
      eyebrow="Journal unpublished"
      title="The journal has no articles yet."
      description="Buying guides and material notes are still being written. No placeholder posts, invented authors or stock advice are published in the meantime."
      notes={[
        'Product specifications and category pages are the most detailed reading available today.',
        'Journal articles will be dated and attributed when they go live.',
        'Subscribing below is real: it stores your email with consent and can be undone.',
      ]}
      primaryHref="/products"
      primaryLabel="Browse the catalogue"
      secondaryHref="/categories"
      secondaryLabel="Shop by category"
    >
      <section
        aria-labelledby="journal-updates"
        className="mt-10 rounded-xl border border-border bg-card p-6"
      >
        <h2 id="journal-updates" className="font-display text-xl font-semibold">
          Get the first edit
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Occasional email updates when the journal or a new collection is published. No daily
          marketing, and you can unsubscribe later.
        </p>
        <div className="mt-5">
          <NewsletterForm />
        </div>
      </section>
    </StatusPage>
  )
}
