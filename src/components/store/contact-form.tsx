'use client'

import { CheckCircle2, Send } from 'lucide-react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { submitContactMessage, type ContactActionState } from '@/app/(storefront)/contact-actions'
import { Button } from '@/components/ui/button'
import { CONTACT_CATEGORIES } from '@/modules/support/contact'

const initialState: ContactActionState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      <Send aria-hidden="true" />
      {pending ? 'Sending…' : 'Send message'}
    </Button>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  )
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactMessage, initialState)

  if (state.status === 'success') {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
          Message logged
        </h2>
        {state.ticketNumber ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Your ticket number is{' '}
            <span className="font-mono font-semibold text-foreground">{state.ticketNumber}</span>.
            Keep it for any follow-up.
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{state.message}</p>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          Customer care is being staffed, so response times are not guaranteed yet. Never send card
          numbers, UPI PINs, passwords or one-time codes.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium">
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium">
            Email address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <FieldError message={state.fieldErrors?.email} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium">
            Phone <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <FieldError message={state.fieldErrors?.phone} />
        </div>
        <div>
          <label htmlFor="contact-category" className="block text-sm font-medium">
            What is this about?
          </label>
          <select
            id="contact-category"
            name="category"
            defaultValue="PRODUCT"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {CONTACT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.category} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="block text-sm font-medium">
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          required
          maxLength={120}
          aria-invalid={Boolean(state.fieldErrors?.subject)}
          className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
        <FieldError message={state.fieldErrors?.subject} />
      </div>

      <div>
        <label htmlFor="contact-description" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="contact-description"
          name="description"
          required
          rows={6}
          maxLength={4000}
          aria-invalid={Boolean(state.fieldErrors?.description)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <FieldError message={state.fieldErrors?.description} />
      </div>

      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-xs leading-6 text-muted-foreground">
        We use these details only to answer your message. Never send card numbers, UPI PINs,
        passwords or one-time codes. The privacy policy is still an unpublished draft.
      </p>

      <SubmitButton />
    </form>
  )
}
