import 'server-only'

import { generateSecret, generateURI, verify } from 'otplib'

import { randomRecoveryCode } from '@/lib/crypto'
import { getEnv } from '@/lib/env'
import { hashPassword, verifyPassword } from '@/lib/auth/passwords'

export interface GeneratedMfaCredential {
  secret: string
  otpauthUrl: string
  recoveryCodes: string[]
  recoveryHashes: string[]
}

export async function generateMfaCredential(accountLabel: string): Promise<GeneratedMfaCredential> {
  const env = getEnv()
  const secret = generateSecret()
  const recoveryCodes = Array.from({ length: 10 }, () => randomRecoveryCode())
  const recoveryHashes = await Promise.all(recoveryCodes.map((code) => hashPassword(code)))

  return {
    secret,
    otpauthUrl: generateURI({
      issuer: env.APP_NAME,
      label: accountLabel,
      secret,
    }),
    recoveryCodes,
    recoveryHashes,
  }
}

export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const normalised = token.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(normalised)) return false
  const result = await verify({
    secret,
    token: normalised,
    // One step in either direction tolerates modest clock drift.
    epochTolerance: 30,
  })
  return result.valid
}

/** Returns the index of a matching recovery code, or -1. */
export async function findRecoveryCode(
  hashes: readonly string[],
  submitted: string,
): Promise<number> {
  const normalised = submitted.trim().toUpperCase()
  for (let index = 0; index < hashes.length; index += 1) {
    const hash = hashes[index]
    if (!hash) continue
    if (await verifyPassword(hash, normalised)) return index
  }
  return -1
}
