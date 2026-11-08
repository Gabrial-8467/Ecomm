import type { Metadata } from 'next'

import { StatusPage } from '@/components/marketing/status-page'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'There are no published roles at CasaCircuit yet.',
  robots: { index: false, follow: true },
}

export default function CareersPage() {
  return (
    <StatusPage
      eyebrow="No open roles"
      title="There are no published roles yet."
      description="No vacancies are listed because none have been approved for publication. This page will not carry evergreen listings or unpaid-role experiments."
      notes={[
        'Roles will include a location, employment type and application route when published.',
        'Applications will go to a monitored address, not a placeholder mailbox.',
        'The about page explains how the store and catalogue are being built.',
      ]}
      primaryHref="/about"
      primaryLabel="About CasaCircuit"
      secondaryHref="/contact"
      secondaryLabel="Contact options"
    />
  )
}
