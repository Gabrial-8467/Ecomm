import type { Metadata } from 'next'

import { StatusPage } from '@/components/marketing/status-page'

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Order tracking opens with checkout.',
  robots: { index: false, follow: true },
}

export default function TrackOrderPage() {
  return (
    <StatusPage
      eyebrow="Tracking not live"
      title="Order tracking is not open yet."
      description="Tracking will be available once checkout and shipping are live. This page does not ask for an order number it cannot look up, and it does not display a simulated delivery status."
      notes={[
        'Delivery will be confirmed against your pincode before payment.',
        'Tracking events will come from the shipping provider, not from a static timeline.',
        'Product pages already show declared return windows and warranty terms.',
      ]}
      primaryHref="/faq"
      primaryLabel="Read delivery questions"
      secondaryHref="/contact"
      secondaryLabel="Contact options"
    />
  )
}
