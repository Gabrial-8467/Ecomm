import 'server-only'

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto'

import { getEnv } from '@/lib/env'

/**
 * Token handling for opaque sessions, CSRF, OTPs and MFA secrets.
 *
 * Tokens are generated with the CSPRNG and only their hashes are persisted.
 * MFA secrets are encrypted at rest with AES-256-GCM.
 */

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/** Numeric OTP generated from the CSPRNG (no modulo bias). */
export function randomNumericCode(digits = 6): string {
  return randomInt(0, 10 ** digits)
    .toString()
    .padStart(digits, '0')
}

/** Human-friendly single-use recovery code, e.g. `K7QF-2M9X-P4RT`. */
export function randomRecoveryCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(12)
  let code = ''
  for (let index = 0; index < 12; index += 1) {
    code += alphabet[bytes[index]! % alphabet.length]
  }
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`
}

/** SHA-256 is sufficient for high-entropy opaque tokens. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** HMAC used for low-entropy secrets such as 6-digit OTPs. */
export function hmacWithPepper(value: string): string {
  return createHmac('sha256', getEnv().OTP_PEPPER).update(value, 'utf8').digest('hex')
}

export function verifyHmacWithPepper(value: string, expectedHex: string): boolean {
  return safeEqual(hmacWithPepper(value), expectedHex)
}

function mfaKey(): Buffer {
  const key = Buffer.from(getEnv().MFA_ENCRYPTION_KEY, 'base64')
  if (key.length !== 32) {
    throw new Error('MFA_ENCRYPTION_KEY must decode to exactly 32 bytes (base64)')
  }
  return key
}

/** Encrypt a TOTP secret. Format: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', mfaKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.')
}

export function decryptSecret(payload: string): string {
  const [version, ivPart, tagPart, dataPart] = payload.split('.')
  if (version !== 'v1' || !ivPart || !tagPart || !dataPart) {
    throw new Error('Malformed encrypted secret')
  }
  const decipher = createDecipheriv('aes-256-gcm', mfaKey(), Buffer.from(ivPart, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
