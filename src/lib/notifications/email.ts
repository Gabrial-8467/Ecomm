import 'server-only'

import { getEnv } from '@/lib/env'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
  template: string
}

function maskEmail(value: string): string {
  const [local, domain] = value.split('@')
  if (!domain || !local) return '[invalid]'
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`
}

async function deliverWithResend(message: EmailMessage): Promise<string | null> {
  const env = getEnv()
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend responded ${response.status}`)
  }
  const body = (await response.json().catch(() => null)) as { id?: string } | null
  return body?.id ?? null
}

/**
 * Sends a transactional email and writes an EmailLog row. Delivery failures do
 * not throw: callers must not leak provider details, and a failed verification
 * email can be retried with the resend endpoint.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const env = getEnv()
  const log = await prisma.emailLog.create({
    data: {
      recipient: message.to,
      template: message.template,
      provider: env.EMAIL_PROVIDER,
      status: 'QUEUED',
    },
    select: { id: true },
  })

  try {
    let providerMessageId: string | null = null
    if (env.EMAIL_PROVIDER === 'resend') {
      providerMessageId = await deliverWithResend(message)
    } else {
      logger.info(
        { recipient: maskEmail(message.to), template: message.template },
        'email delivered to console provider',
      )
    }

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: 'SENT',
        providerMessageId,
        sentAt: new Date(),
        attempts: { increment: 1 },
      },
    })
    return true
  } catch (error) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message.slice(0, 500) : 'Unknown email error',
        attempts: { increment: 1 },
      },
    })
    logger.error({ err: error, template: message.template }, 'email delivery failed')
    return false
  }
}
