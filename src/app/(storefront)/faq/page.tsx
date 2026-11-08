import type { Metadata } from 'next'
import { ArrowRight, CircleHelp } from 'lucide-react'
import Link from 'next/link'

import { JsonLd } from '@/components/seo/json-ld'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description:
    'What is live on CasaCircuit today, how prices and GST work, and when cart, checkout, delivery and returns will open.',
  alternates: { canonical: '/faq' },
}

type FaqItem = { question: string; answer: string }
type FaqSection = { title: string; items: FaqItem[] }

const SECTIONS: FaqSection[] = [
  {
    title: 'Shopping on CasaCircuit',
    items: [
      {
        question: 'What can I do on CasaCircuit right now?',
        answer:
          'You can browse the published catalogue, filter by category, brand, price and product attributes, view product specifications and declared warranty and return terms, and create an account. Cart, checkout, payments and order history are not open yet.',
      },
      {
        question: 'Do the prices include GST?',
        answer:
          'Yes. Every price shown on the storefront is tax-inclusive and includes the applicable GST. The tax component is broken out on the order invoice once checkout is live.',
      },
      {
        question: 'Why can I not add a product to the cart?',
        answer:
          'The add-to-cart control is deliberately disabled until the cart, inventory reservation and payment flow are implemented. The catalogue is live so product information and prices can be reviewed before checkout opens.',
      },
      {
        question: 'Are the product specifications reliable?',
        answer:
          'Specifications are stored as structured product data and are validated before a product can be published. A product cannot go live without the declarations required for Indian listings, including seller identity and consumer-care details.',
      },
    ],
  },
  {
    title: 'Orders, delivery and returns',
    items: [
      {
        question: 'When will checkout open?',
        answer:
          'Checkout is the next release. There is no date to publish yet, and the site will not promise a launch date it cannot enforce.',
      },
      {
        question: 'Where do you deliver?',
        answer:
          'Delivery will be confirmed against your pincode before payment. A public serviceable-pincode list and delivery estimates are not published yet, so no delivery promise is being made today.',
      },
      {
        question: 'How do returns and warranty work?',
        answer:
          'Return windows and warranty terms are stored per product and shown on the product page. The self-service return and refund flow is not live, and the returns policy is still an unpublished draft, so no return outcome is promised at this stage.',
      },
      {
        question: 'Can I track an order?',
        answer:
          'Not yet. Order history and tracking open with checkout. The tracking page currently explains what will be available rather than asking for an order number it cannot look up.',
      },
    ],
  },
  {
    title: 'Reviews, policies and support',
    items: [
      {
        question: 'Are there customer reviews?',
        answer:
          'No. Reviews will only be accepted from verified purchases, and no reviews or ratings have been seeded. The catalogue does not display invented social proof.',
      },
      {
        question: 'Where are the terms and privacy policy?',
        answer:
          'The legal section lists every document with its exact status. All current documents are drafts awaiting review by Indian counsel, so their text is not shown and they are not presented as policies in force.',
      },
      {
        question: 'How do I contact customer care?',
        answer:
          'Customer care opens with checkout. The contact page explains the status and will publish monitored contact details only when they are real, rather than showing a placeholder email address.',
      },
      {
        question: 'How is my account protected?',
        answer:
          'Passwords are hashed with Argon2id and sessions are database-backed, opaque and revocable from the account page. Staff accounts require multi-factor authentication before they can use the admin area.',
      },
    ],
  },
]

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    ),
  }

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Help</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          Straight answers about what works today, what is still being built, and what CasaCircuit
          will not claim before it can enforce it.
        </p>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title} aria-labelledby={`faq-${section.title}`}>
              <h2
                id={`faq-${section.title}`}
                className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight"
              >
                <CircleHelp className="size-5 text-accent" aria-hidden="true" />
                {section.title}
              </h2>
              <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {section.items.map((item) => (
                  <details key={item.question} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                      {item.question}
                      <span
                        aria-hidden="true"
                        className="text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border bg-secondary/40 p-6">
          <h2 className="font-display text-lg font-semibold">Still have a question?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The contact page explains which support channels are open. Legal documents and their
            review status are listed in the legal section.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/contact">
                Contact options
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/legal">Legal documents</Link>
            </Button>
          </div>
        </div>
      </div>

      <JsonLd data={faqJsonLd} />
    </div>
  )
}
