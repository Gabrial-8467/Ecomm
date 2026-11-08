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
