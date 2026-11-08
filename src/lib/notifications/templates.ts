import 'server-only'

import { getEnv } from '@/lib/env'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function layout(title: string, body: string): string {
  const env = getEnv()
  return `<!doctype html>
<html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#faf8f4;color:#2b2620;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e2d8;border-radius:12px;padding:28px">
    <p style="margin:0 0 20px;font-size:18px;font-weight:700">${escapeHtml(env.APP_NAME)}</p>
    <h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(title)}</h1>
    ${body}
    <p style="margin:28px 0 0;font-size:12px;color:#6b6257">This is an automated service message. Do not reply.</p>
  </div>
</body></html>`
}

function button(href: string, label: string): string {
  return `<p style="margin:22px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#2b2620;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px">${escapeHtml(label)}</a></p>`
}

export function verificationEmail(input: { token: string; name?: string | null }) {
  const env = getEnv()
  const url = `${env.APP_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(input.token)}`
  const greeting = input.name ? `Hi ${input.name},` : 'Hello,'
  return {
    template: 'auth.email_verification',
    subject: `Verify your ${env.APP_NAME} email address`,
    text: `${greeting}\n\nConfirm your email address to finish creating your ${env.APP_NAME} account:\n${url}\n\nThis link expires in ${env.EMAIL_VERIFY_TTL_HOURS} hours. If you did not create an account, ignore this email.`,
    html: layout(
      'Confirm your email address',
      `<p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
       <p style="margin:0 0 12px">Confirm your email address to finish creating your ${escapeHtml(env.APP_NAME)} account.</p>
       ${button(url, 'Verify email')}
       <p style="margin:0;font-size:13px;color:#6b6257">This link expires in ${env.EMAIL_VERIFY_TTL_HOURS} hours. If you did not create an account, ignore this email.</p>`,
    ),
  }
}

export function passwordResetEmail(input: { token: string; name?: string | null }) {
  const env = getEnv()
  const url = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(input.token)}`
  const greeting = input.name ? `Hi ${input.name},` : 'Hello,'
  return {
    template: 'auth.password_reset',
    subject: `Reset your ${env.APP_NAME} password`,
    text: `${greeting}\n\nUse this link to choose a new password:\n${url}\n\nThis link expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes and can be used once. If you did not request this, ignore this email and consider changing your password.`,
    html: layout(
      'Reset your password',
      `<p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
       <p style="margin:0 0 12px">Use the button below to choose a new password.</p>
       ${button(url, 'Choose a new password')}
       <p style="margin:0;font-size:13px;color:#6b6257">This link expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes and can be used once. If you did not request this, ignore this email and consider changing your password.</p>`,
    ),
  }
}

export function loginAlertEmail(input: { name?: string | null; ip?: string | null }) {
  const env = getEnv()
  const greeting = input.name ? `Hi ${input.name},` : 'Hello,'
  const location = input.ip ? ` from ${input.ip}` : ''
  return {
    template: 'auth.login_alert',
    subject: `New sign-in to your ${env.APP_NAME} account`,
    text: `${greeting}\n\nA new sign-in to your account was recorded${location}. If this was you, no action is needed. If not, reset your password immediately.`,
    html: layout(
      'New sign-in',
      `<p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
       <p style="margin:0 0 12px">A new sign-in to your account was recorded${escapeHtml(location)}.</p>
       <p style="margin:0;font-size:13px;color:#6b6257">If this was you, no action is needed. If not, reset your password immediately.</p>`,
    ),
  }
}

export function otpSms(input: { code: string; minutes: number }) {
  const env = getEnv()
  return {
    template: 'auth.otp',
    text: `${input.code} is your ${env.APP_NAME} verification code. It expires in ${input.minutes} minutes. Never share this code.`,
  }
}

export function orderConfirmationEmail(input: {
  orderNumber: string
  email: string
  total: string
  paymentMethod?: string | null
  items: { name: string; quantity: number; lineTotal: string }[]
  viewUrl: string
}) {
  const env = getEnv()
  const method =
    input.paymentMethod === 'COD'
      ? 'Cash on delivery — pay the courier when your order arrives.'
      : input.paymentMethod === 'RAZORPAY'
        ? 'Paid online — the payment provider confirmed this order.'
        : 'Payment status will update once confirmed.'
  const lines = input.items
    .map((item) => `${item.quantity} × ${item.name} — ₹${item.lineTotal}`)
    .join('\n')
  const rows = input.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${escapeHtml(item.name)}</td><td style="padding:6px 0;text-align:center">${item.quantity}</td><td style="padding:6px 0;text-align:right">₹${escapeHtml(item.lineTotal)}</td></tr>`,
    )
    .join('')

  return {
    template: 'order.confirmation',
    subject: `Order ${input.orderNumber} confirmed`,
    text: `Hello,\n\nThank you for your order ${input.orderNumber}.\n\n${lines}\n\nTotal: ₹${input.total}\n${method}\n\nView your order: ${input.viewUrl}\n\nDelivery dates are estimates based on your PIN code and are not a guarantee. Keep this email for your records.`,
    html: layout(
      `Order ${input.orderNumber}`,
      `<p style="margin:0 0 12px">Thank you for shopping with ${escapeHtml(env.APP_NAME)}.</p>
       <p style="margin:0 0 16px">${escapeHtml(method)}</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
       <p style="margin:16px 0 0;font-weight:700">Total: ₹${escapeHtml(input.total)}</p>
       ${button(input.viewUrl, 'View your order')}
       <p style="margin:0;font-size:13px;color:#6b6257">Delivery dates are estimates based on your PIN code and are not a guarantee. Keep this email for your records.</p>`,
    ),
  }
}

export function contactAcknowledgementEmail(input: {
  name: string
  ticketNumber: string
  subject: string
  message: string
}) {
  const env = getEnv()
  const greeting = input.name ? `Hi ${input.name},` : 'Hello,'
  return {
    template: 'support.ticket_received',
    subject: `We received your message (${input.ticketNumber})`,
    text: `${greeting}\n\nYour message to ${env.APP_NAME} has been logged as ticket ${input.ticketNumber}.\n\nSubject: ${input.subject}\n\n${input.message}\n\nCustomer care is being staffed, so response times are not guaranteed yet. Quote ticket ${input.ticketNumber} in any follow-up. Do not send passwords, card numbers, UPI PINs or one-time codes.`,
    html: layout(
      'Your message has been logged',
      `<p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
       <p style="margin:0 0 12px">Your message to ${escapeHtml(env.APP_NAME)} has been logged as ticket <strong>${escapeHtml(input.ticketNumber)}</strong>.</p>
       <p style="margin:0 0 4px;font-size:13px;color:#6b6257">Subject</p>
       <p style="margin:0 0 16px">${escapeHtml(input.subject)}</p>
       <p style="margin:0 0 4px;font-size:13px;color:#6b6257">Your message</p>
       <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.message)}</p>
       <p style="margin:20px 0 0;font-size:13px;color:#6b6257">Customer care is being staffed, so response times are not guaranteed yet. Quote ticket ${escapeHtml(input.ticketNumber)} in any follow-up. Never send passwords, card numbers, UPI PINs or one-time codes.</p>`,
    ),
  }
}
