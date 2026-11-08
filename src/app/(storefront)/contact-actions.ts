'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import type { TicketCategory } from '@/generated/prisma/enums'
import { enforceRateLimits } from '@/lib/auth/rate-limit'
import { isAppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/notifications/email'
import { contactAcknowledgementEmail } from '@/lib/notifications/templates'
import { prisma } from '@/lib/prisma'

export interface ContactActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  ticketNumber?: string
  fieldErrors?: Record<string, string>
}

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Tell us your name.').max(80, 'Use 80 characters or fewer.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || /^[0-9+\-()\s]{6,20}$/.test(value), {
      message: 'Enter a valid phone number or leave it blank.',
    }),
  category: z.enum([
    'PRODUCT',
    'ORDER',
    'PAYMENT',
    'DELIVERY',
    'RETURN',
    'REFUND',
    'ACCOUNT',
    'TECHNICAL',
    'OTHER',
  ]),
  subject: z
    .string()
    .trim()
    .min(3, 'Add a short subject.')
    .max(120, 'Use 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(10, 'Please add a little more detail.')
    .max(4_000, 'Use 4,000 characters or fewer.'),
})

function ticketNumber(): string {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '')
  const suffix = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0')
  return `CC-${date}-${suffix}`
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (key && !result[key]) result[key] = issue.message
  }
  return result
}

async function clientIp(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() ?? headerList.get('x-real-ip') ?? 'unknown'
}

export async function submitContactMessage(
  _previous: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  // Honeypot: real visitors never fill this hidden field. Checked before
  // validation so off-screen bot submissions do not consume error responses.
  if (String(formData.get('company') ?? '').trim()) {
    return { status: 'success', message: 'Your message has been received.' }
  }

  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? undefined,
    category: formData.get('category'),
    subject: formData.get('subject'),
    description: formData.get('description'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    }
  }

  try {
    const ip = await clientIp()
    await enforceRateLimits([
      { bucket: 'contact-ip', identifier: ip, limit: 5, windowSeconds: 60 * 60 },
      {
        bucket: 'contact-email',
        identifier: parsed.data.email,
        limit: 3,
        windowSeconds: 60 * 60,
      },
    ])

    const number = ticketNumber()
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: number,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        category: parsed.data.category as TicketCategory,
        subject: parsed.data.subject,
        description: parsed.data.description,
        status: 'OPEN',
        priority: 'NORMAL',
        messages: {
          create: {
            senderType: 'CUSTOMER',
            body: parsed.data.description,
          },
        },
      },
      select: { ticketNumber: true },
    })

    const template = contactAcknowledgementEmail({
      name: parsed.data.name,
      ticketNumber: ticket.ticketNumber,
      subject: parsed.data.subject,
      message: parsed.data.description,
    })
    await sendEmail({ to: parsed.data.email, ...template })

    return {
      status: 'success',
      ticketNumber: ticket.ticketNumber,
      message: `Your message was logged as ticket ${ticket.ticketNumber}. We also sent a copy to ${parsed.data.email}.`,
    }
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message }
    }
    logger.error({ err: error }, 'contact message failed')
    return {
      status: 'error',
      message: 'We could not log your message. Please try again in a moment.',
    }
  }
}
