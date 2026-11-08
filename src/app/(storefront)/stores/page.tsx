import type { Metadata } from 'next'

import { StatusPage } from '@/components/marketing/status-page'

export const metadata: Metadata = {
  title: 'Stores',
  description: 'CasaCircuit does not publish store locations yet.',
  robots: { index: false, follow: true },
}

export default function StoresPage() {
  return (
    <StatusPage
      eyebrow="Online catalogue only"
      title="No store locations are published."
      description="CasaCircuit is being built as an online single-seller store. There is no store locator to show because no physical locations have been opened or verified."
      notes={[
        'Inventing showroom addresses or opening hours would mislead customers, so none are listed.',
        'Delivery serviceability will be confirmed against your pincode at checkout.',
        'Product pages carry the specifications you would normally inspect in person.',
      ]}
      primaryHref="/products"
      primaryLabel="Browse the catalogue"
      secondaryHref="/contact"
      secondaryLabel="Contact options"
    />
  )
}
