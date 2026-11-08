import type { Metadata } from 'next'

import { StatusPage } from '@/components/marketing/status-page'

export const metadata: Metadata = {
  title: 'Your orders',
  description: 'Order history opens with checkout.',
  robots: { index: false, follow: true },
}

export default function OrdersPage() {
  return (
    <StatusPage
      eyebrow="Orders open with checkout"
      title="There are no orders yet."
      description="Order history is part of the checkout release. Because checkout is not open, no order can exist and this page has nothing to list. It will never show sample or demo orders."
      notes={[
        'Account sign-in, profile updates and session management are live now.',
        'Invoices, cancellations and returns will be attached to real orders only.',
        'Order confirmation and status emails will be sent when checkout opens.',
      ]}
      primaryHref="/account"
      primaryLabel="Go to your account"
      secondaryHref="/faq"
      secondaryLabel="Read the FAQ"
    />
  )
}
