import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'

import { getEnv } from '@/lib/env'

import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK'],
})

export const metadata: Metadata = {
  metadataBase: new URL(getEnv().APP_URL),
  title: {
    default: 'CasaCircuit — Furniture and electronics for considered homes',
    template: '%s | CasaCircuit',
  },
  description:
    'Shop furniture and electronics with transparent pricing, GST invoices, delivery and installation across serviceable Indian pincodes.',
  applicationName: 'CasaCircuit',
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'CasaCircuit',
    title: 'CasaCircuit — Furniture and electronics for considered homes',
    description:
      'Furniture and electronics with transparent pricing, GST invoices, delivery and installation.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CasaCircuit',
    description: 'Furniture and electronics for considered homes.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#2b2620' },
  ],
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
