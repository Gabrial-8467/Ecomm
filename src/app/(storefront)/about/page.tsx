import type { Metadata } from 'next'
import { ArrowRight, BadgeCheck, FileCheck2, Ruler, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About CasaCircuit',
  description:
    'CasaCircuit is an India-focused furniture and electronics catalogue built around documented specifications, tax-inclusive prices and honest availability.',
  alternates: { canonical: '/about' },
}

const PRINCIPLES = [
  {
    icon: Ruler,
    title: 'Specifications before adjectives',
    body: 'Dimensions, materials, panel types and warranty terms are captured as product data, not buried in marketing copy.',
  },
  {
    icon: FileCheck2,
    title: 'Declarations before publishing',
    body: 'A product cannot go live without the Legal Metrology declarations, seller identity and consumer-care details required for Indian listings.',
  },
  {
    icon: ShieldCheck,
    title: 'No invented social proof',
    body: 'Ratings and reviews will only appear after a verified purchase. The catalogue does not seed fake reviews or customer counts.',
  },
]

const LIVE = [
  { href: '/products', label: 'Published product catalogue' },
  { href: '/categories', label: 'Category tree' },
  { href: '/brands', label: 'Brand directory' },
  { href: '/account', label: 'Account and security settings' },
]

export default function AboutPage() {
  return (
    <div className="container-page py-12 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">About</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          Furniture and electronics for how Indian homes actually live.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          CasaCircuit is being built as a single-seller store rather than a marketplace. That means
          one accountable seller, one catalogue standard and one place to resolve a problem. The
          catalogue is live today; cart, checkout and order tracking are still being built.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <section key={principle.title} className="rounded-xl border border-border bg-card p-5">
              <principle.icon className="size-5 text-accent" aria-hidden="true" />
              <h2 className="mt-3 font-display text-base font-semibold">{principle.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-12 grid gap-8 border-t border-border pt-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">What is live now</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These routes are implemented and backed by the catalogue database. Anything not listed
              here is being prepared and will say so rather than pretending to work.
            </p>
            <ul className="mt-5 space-y-2">
              {LIVE.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    {item.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              What we will not claim
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  We do not publish legal policies until counsel has reviewed them. The legal pages
                  currently state that the documents are unpublished drafts.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  We do not promise delivery dates, installation coverage or return outcomes that
                  the system cannot enforce against a real pincode and order.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  We do not show customer counts, ratings or testimonials that are not backed by
                  verified records.
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
