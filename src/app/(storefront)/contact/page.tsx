import type { Metadata } from 'next'
import { ArrowRight, Mail, MessageCircleQuestion, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

import { ContactForm } from '@/components/store/contact-form'
import { getEnv } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Contact CasaCircuit',
  description:
    'Send a message to CasaCircuit about a product, account or website issue. No account is required.',
  alternates: { canonical: '/contact' },
}

/** Placeholder addresses must never be presented as a working support channel. */
function usableSupportEmail(email: string): string | null {
  const lower = email.toLowerCase()
  if (lower.endsWith('.invalid') || /@example\.(com|org|net)$/.test(lower)) return null
  return email
}

export default function ContactPage() {
  const supportEmail = usableSupportEmail(getEnv().SUPPORT_EMAIL)

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Contact</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Talk to CasaCircuit
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Send a message about a product, an account or the website. No account is required, and
          every message is logged as a support ticket with a reference number.
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card p-5 text-sm leading-6">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-muted-foreground">
            Customer care is being staffed. Messages are stored and acknowledged by email, but
            response times are not guaranteed yet. For order-specific questions, include your order
            number once checkout is live.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)]">
          <section aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading" className="font-display text-2xl font-semibold">
              Send a message
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fields marked required must be filled. We use your details only to answer this
              message.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </section>

          <aside className="space-y-4">
            {supportEmail ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Mail className="size-5 text-accent" aria-hidden="true" />
                  Email us
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Prefer email? Write to{' '}
                  <a
                    className="font-medium text-foreground underline underline-offset-2"
                    href={`mailto:${supportEmail}`}
                  >
                    {supportEmail}
                  </a>
                  .
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-card p-5">
              <MessageCircleQuestion className="size-5 text-accent" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-semibold">Check the FAQ first</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Delivery, GST, returns and account security questions are answered there.
              </p>
              <Link
                href="/faq"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:text-accent"
              >
                Read the FAQ
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <ShieldAlert className="size-5 text-accent" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-semibold">Policies</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Every legal document shows whether it is in force or still a draft.
              </p>
              <Link
                href="/legal"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:text-accent"
              >
                Legal documents
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
