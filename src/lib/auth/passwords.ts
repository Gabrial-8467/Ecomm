import { hash, parseOptions, verify, type Algorithm } from '@node-rs/argon2'

import { getEnv } from '@/lib/env'
import { ValidationError } from '@/lib/errors'

/**
 * Password policy and Argon2id hashing.
 *
 * Parameters are fixed here (not environment-tunable) so a deployment cannot
 * silently weaken password storage. A successful login rehashes credentials
 * when the parameters change.
 */
// `Algorithm` is an ambient const enum, which is inaccessible under
// `isolatedModules`. Argon2id's stable wire value is 2.
const ARGON2ID: Algorithm = 2

const ARGON2_MEMORY_KIB = 64 * 1024
const ARGON2_TIME_COST = 3
const ARGON2_PARALLELISM = 1
const ARGON2_OUTPUT_LEN = 32
const PASSWORD_MAX_LENGTH = 128

const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: ARGON2_MEMORY_KIB,
  timeCost: ARGON2_TIME_COST,
  parallelism: ARGON2_PARALLELISM,
  outputLen: ARGON2_OUTPUT_LEN,
} as const

/**
 * A small local blocklist of passwords that appear at the top of every
 * breach corpus. HIBP k-anonymity can be layered on later without changing
 * the policy contract.
 */
const COMMON_PASSWORDS = new Set(
  [
    '123456',
    '123456789',
    '12345678',
    'password',
    'password1',
    'password123',
    'qwerty',
    'qwerty123',
    'abc123',
    'letmein',
    'welcome',
    'welcome1',
    'admin',
    'admin123',
    'iloveyou',
    'monkey',
    'dragon',
    'sunshine',
    'princess',
    'football',
    'baseball',
    'master',
    'shadow',
    'superman',
    'michael',
    'trustno1',
    'passw0rd',
    'p@ssw0rd',
    'india123',
    'indian',
    'namaste',
    'casacircuit',
    'casacircuit123',
  ].map((value) => value.toLowerCase()),
)

export interface PasswordPolicyOptions {
  staff?: boolean
  email?: string | null
  name?: string | null
}

function normalise(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Validates a candidate password. Throws `ValidationError` with a message safe
 * for the end user. Composition rules are intentionally not imposed; length
 * plus a blocklist follows current NIST guidance and the security contract.
 */
export function assertPasswordPolicy(password: string, options: PasswordPolicyOptions = {}): void {
  const minLength = options.staff
    ? getEnv().PASSWORD_STAFF_MIN_LENGTH
    : getEnv().PASSWORD_MIN_LENGTH

  const problems: string[] = []

  if (password.length < minLength) {
    problems.push(`Use at least ${minLength} characters.`)
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    problems.push(`Use no more than ${PASSWORD_MAX_LENGTH} characters.`)
  }
  if (password.trim() !== password) {
    problems.push('Do not start or end the password with spaces.')
  }
  if (COMMON_PASSWORDS.has(normalise(password))) {
    problems.push('This password is too common. Choose something less predictable.')
  }
  if (/^(.)\1+$/.test(password)) {
    problems.push('Do not repeat a single character.')
  }

  const email = options.email?.trim().toLowerCase()
  if (email) {
    const localPart = email.split('@')[0]
    if (localPart && localPart.length >= 3 && normalise(password).includes(localPart)) {
      problems.push('Do not include your email address in the password.')
    }
  }

  const name = options.name?.trim().toLowerCase()
  if (name && name.length >= 3 && normalise(password).includes(name)) {
    problems.push('Do not include your name in the password.')
  }

  if (problems.length > 0) {
    throw new ValidationError(problems[0], problems)
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(hashString: string, password: string): Promise<boolean> {
  try {
    return await verify(hashString, password, ARGON2_OPTIONS)
  } catch {
    return false
  }
}

/** True when a stored hash was produced with weaker/different parameters. */
export function passwordNeedsRehash(hashString: string): boolean {
  try {
    const parsed = parseOptions(hashString)
    return (
      parsed.algorithm !== ARGON2ID ||
      parsed.memoryCost !== ARGON2_MEMORY_KIB ||
      parsed.timeCost !== ARGON2_TIME_COST ||
      parsed.parallelism !== ARGON2_PARALLELISM ||
      parsed.outputLen !== ARGON2_OUTPUT_LEN
    )
  } catch {
    return true
  }
}

/**
 * Constant-work comparison for a non-existent account. The promise is created
 * lazily so process start-up and apps that never receive a login are unaffected.
 */
let dummyHashPromise: Promise<string> | null = null

export async function verifyAgainstDummyPassword(password: string): Promise<false> {
  dummyHashPromise ??= hashPassword('not-a-real-account-password-placeholder')
  const dummy = await dummyHashPromise
  await verifyPassword(dummy, password)
  return false
}
