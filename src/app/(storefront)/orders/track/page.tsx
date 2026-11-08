import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TrackOrderForm } from './track-order-form'

export const metadata: Metadata = {
  title: 'Track Your Order | CasaCircuit',
  description: 'Look up real-time delivery status, tracking events, and invoices for your order.',
  robots: { index: false, follow: true },
}

export default function TrackOrderPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mb-6 flex justify-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/orders">
            <ArrowLeft className="size-4 mr-2" aria-hidden="true" />
            Back to account orders
          </Link>
        </Button>
      </div>

      <TrackOrderForm />
    </div>
  )
}
