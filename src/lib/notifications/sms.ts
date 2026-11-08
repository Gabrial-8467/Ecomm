import 'server-only'

import { getEnv } from '@/lib/env'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export interface SmsMessage {
  to: string
  text: string
  template: string
}

function maskPhone(value: string): string {
  if (value.length <= 4) return '****'
  return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`
}

async function deliverWithMsg91(message: SmsMessage): Promise<string | null> {
  const env = getEnv()
  const response = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      authkey: env.MSG91_AUTH_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: env.MSG91_TEMPLATE_ID,
      sender: env.SMS_SENDER_ID,
      recipients: [{ mobiles: message.to.replace('+', ''), message: message.text }],
    }),
  })
  if (!response.ok) throw new Error(`MSG91 responded ${response.status}`)
  const body = (await response.json().catch(() => null)) as { request_id?: string } | null
  return body?.request_id ?? null
}

async function deliverWithTwilio(message: SmsMessage): Promise<string | null> {
  const env = getEnv()
  const credentials = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString(
    'base64',
  )
  const body = new URLSearchParams({
    To: message.to,
    From: env.TWILIO_FROM ?? '',
    Body: message.text,
  })
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
  )
  if (!response.ok) throw new Error(`Twilio responded ${response.status}`)
  const parsed = (await response.json().catch(() => null)) as { sid?: string } | null
  return parsed?.sid ?? null
}

/** Sends an SMS/OTP through the configured adapter and writes an SmsLog row. */
export async function sendSms(message: SmsMessage): Promise<boolean> {
  const env = getEnv()
  const log = await prisma.smsLog.create({
    data: {
      recipient: message.to,
      template: message.template,
      provider: env.SMS_PROVIDER,
      status: 'QUEUED',
    },
    select: { id: true },
  })

  try {
    let providerMessageId: string | null = null
    if (env.SMS_PROVIDER === 'msg91') providerMessageId = await deliverWithMsg91(message)
    else if (env.SMS_PROVIDER === 'twilio') providerMessageId = await deliverWithTwilio(message)
    else {
      logger.info(
        { recipient: maskPhone(message.to), template: message.template },
        'SMS delivered to console provider',
      )
    }

    await prisma.smsLog.update({
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
    await prisma.smsLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message.slice(0, 500) : 'Unknown SMS error',
        attempts: { increment: 1 },
      },
    })
    logger.error({ err: error, template: message.template }, 'SMS delivery failed')
    return false
  }
}
