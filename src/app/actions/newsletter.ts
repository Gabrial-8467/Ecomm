'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { getCache } from '@/lib/cache'
import { hashToken } from '@/lib/crypto'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export interface NewsletterState {
  status: 'idle' | 'success' | 'error'
  message?: string
}

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  consent: z.literal('on', { message: 'Please confirm you agree to receive email updates.' }),
  company: z.string().max(0).optional(),
})

export async function subscribeToNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get('email'),
    consent: formData.get('consent'),
    company: formData.get('company') ?? undefined,
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Please check the form and try again.',
    }
  }

  // Honeypot: real users never fill this hidden field.
  if (parsed.data.company) {
    return { status: 'success', message: 'You are on the list.' }
  }

  try {
    const headerList = await headers()
    const forwarded = headerList.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ?? headerList.get('x-real-ip') ?? 'unknown'
    const cache = await getCache()
    const attempts = await cache.incr(`ratelimit:newsletter:${hashToken(ip)}`, 60 * 60)

    if (attempts > 10) {
      return { status: 'error', message: 'Too many attempts. Please try again later.' }
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {
        status: 'SUBSCRIBED',
        consentAt: new Date(),
        unsubscribedAt: null,
        source: 'storefront',
      },
      create: {
        email: parsed.data.email,
        status: 'SUBSCRIBED',
        consentAt: new Date(),
        source: 'storefront',
      },
    })

    return { status: 'success', message: 'You are on the list. Look out for our next edit.' }
  } catch (error) {
    logger.error({ err: error }, 'newsletter subscription failed')
    return { status: 'error', message: 'We could not save your subscription. Please try again.' }
  }
}
