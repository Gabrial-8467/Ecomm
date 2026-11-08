'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowRight } from 'lucide-react'

import { subscribeToNewsletter, type NewsletterState } from '@/app/actions/newsletter'
import { Button } from '@/components/ui/button'

const initialState: NewsletterState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="accent" disabled={pending} className="shrink-0">
      {pending ? 'Subscribing…' : 'Subscribe'}
      <ArrowRight aria-hidden="true" />
    </Button>
  )
}

export function NewsletterForm() {
  const [state, formAction] = useActionState(subscribeToNewsletter, initialState)
  const errorId = state.status === 'error' ? 'newsletter-error' : undefined

  return (
    <form action={formAction} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-describedby={errorId}
            placeholder="you@example.com"
            className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition outline-none focus:border-accent focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <SubmitButton />
      </div>

      <div className="mt-3 hidden" aria-hidden="true">
        <label htmlFor="newsletter-company">Company</label>
        <input
          id="newsletter-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 size-3.5 rounded border-input accent-[var(--accent)]"
        />
        <span className="text-white">
          I agree to receive occasional email updates from CasaCircuit. I can unsubscribe at any
          time. See the{' '}
          <a href="/legal/privacy" className="underline underline-offset-2">
            privacy policy
          </a>
          .
        </span>
      </label>

      <p
        id={errorId}
        aria-live="polite"
        className={
          state.status === 'error' ? 'mt-3 text-sm text-destructive' : 'mt-3 text-sm text-success'
        }
      >
        {state.status !== 'idle' ? state.message : null}
      </p>
    </form>
  )
}
