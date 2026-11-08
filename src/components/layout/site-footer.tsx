import { Mail, MapPin, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { getEnv } from '@/lib/env'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/categories/furniture', label: 'Furniture' },
      { href: '/categories/electronics', label: 'Electronics' },
      { href: '/products?sort=newest', label: 'New arrivals' },
      { href: '/products?sort=discount', label: 'Deals' },
      { href: '/brands', label: 'Brands' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/contact', label: 'Contact us' },
      { href: '/faq', label: 'FAQs' },
      { href: '/orders/track', label: 'Track your order' },
      { href: '/legal/shipping', label: 'Shipping & delivery' },
      { href: '/legal/returns', label: 'Returns & refunds' },
      { href: '/legal/warranty', label: 'Warranty' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About CasaCircuit' },
      { href: '/blog', label: 'Journal' },
      { href: '/stores', label: 'Stores' },
      { href: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { href: '/legal/terms', label: 'Terms of use' },
      { href: '/legal/privacy', label: 'Privacy policy' },
      { href: '/legal/cookies', label: 'Cookie notice' },
      { href: '/legal/cancellation', label: 'Cancellation' },
      { href: '/legal/grievance', label: 'Grievance redressal' },
    ],
  },
]

export function SiteFooter() {
  const env = getEnv()
  const supportEmail = env.SUPPORT_EMAIL.endsWith('.invalid') ? null : env.SUPPORT_EMAIL
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-sm">
            <p className="font-display text-2xl font-semibold">CasaCircuit</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Furniture and electronics chosen for how Indian homes actually live. Clear pricing,
              documented warranties and delivery to serviceable pincodes.
            </p>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>Serviceability is confirmed against your delivery pincode at checkout.</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
                <span>All prices include applicable GST.</span>
              </p>
              {supportEmail ? (
                <p className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  <a className="hover:text-foreground" href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                </p>
              ) : (
                <p className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  <Link className="hover:text-foreground" href="/contact">
                    Contact customer care
                  </Link>
                </p>
              )}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-semibold tracking-[0.16em] text-foreground uppercase">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} CasaCircuit. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>UPI · Cards · Net banking · Cash on delivery</span>
            <a
              href="https://www.instagram.com/"
              rel="noreferrer noopener"
              target="_blank"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
