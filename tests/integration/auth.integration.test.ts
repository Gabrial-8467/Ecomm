import { beforeEach, describe, expect, it } from 'vitest'

import { generate } from 'otplib'

import {
  AccountLockedError,
  EmailTakenError,
  ForbiddenError,
  NotFoundError,
  OtpError,
  RateLimitError,
  UnauthenticatedError,
} from '@/lib/errors'
import { resetCacheForTests } from '@/lib/cache'
import {
  assertAnyPermission,
  assertCsrfToken,
  assertPermission,
  assertStaff,
  createSession,
  listUserSessions,
  revokeAllUserSessions,
  rotateSession,
  validateSessionToken,
} from '@/lib/auth/sessions'
import { issueToken } from '@/lib/auth/tokens'
import { hmacWithPepper, hashToken } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'
import {
  changePassword,
  enableMfa,
  listSessionsForActor,
  login,
  logout,
  prepareMfaSetup,
  register,
  requestPasswordReset,
  requestPhoneOtp,
  resendVerification,
  resetPassword,
  revokeOwnSession,
  revokeSessionsForPrivilegeChange,
  verifyEmail,
  verifyMfa,
  verifyPhoneOtp,
} from '@/modules/auth'
import {
  TEST_PASSWORD,
  createCustomerUser,
  createStaffUser,
  grantPermission,
  resetDatabase,
  uniqueEmail,
  uniquePhone,
} from './factories'

const ctx = { ip: '203.0.113.10', userAgent: 'vitest' }

beforeEach(async () => {
  resetCacheForTests()
  await resetDatabase()
})

describe('registration and email verification', () => {
  it('creates a pending customer with hashed credentials and a single-use token', async () => {
    const email = uniqueEmail('register')
    await register(
      {
        email,
        password: TEST_PASSWORD,
        firstName: 'Asha',
        lastName: 'Rao',
        marketingOptIn: true,
      },
      ctx,
    )

    const user = await prisma.user.findUnique({ where: { email } })
    expect(user?.status).toBe('PENDING_VERIFICATION')
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/)
    expect(user?.passwordHash).not.toContain(TEST_PASSWORD)
    expect(user?.emailVerifiedAt).toBeNull()
    expect(user?.marketingOptIn).toBe(true)

    const tokens = await prisma.verificationToken.findMany({ where: { userId: user!.id } })
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.type).toBe('EMAIL_VERIFY')
    expect(tokens[0]?.consumedAt).toBeNull()
    // Only a hash is persisted.
    expect(tokens[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/)

    const logs = await prisma.emailLog.findMany({ where: { recipient: email } })
    expect(logs.some((log) => log.template === 'auth.email_verification')).toBe(true)
    expect(JSON.stringify(logs)).not.toContain(tokens[0]!.tokenHash)
  })

  it('does not reveal whether an email address exists during login', async () => {
    const known = await createCustomerUser({ email: uniqueEmail('known') })

    const unknownError = await login(
      { email: uniqueEmail('unknown'), password: TEST_PASSWORD },
      ctx,
    ).catch((error: unknown) => error)
    const wrongPasswordError = await login(
      { email: known.email!, password: 'Wrong-Password-123!' },
      ctx,
    ).catch((error: unknown) => error)

    expect(unknownError).toBeInstanceOf(UnauthenticatedError)
    expect(wrongPasswordError).toBeInstanceOf(UnauthenticatedError)
    expect((unknownError as Error).message).toBe((wrongPasswordError as Error).message)
  })

  it('returns generic success for unknown accounts on recovery endpoints', async () => {
    const email = uniqueEmail('missing')
    await requestPasswordReset(email, ctx)
    await resendVerification(email, ctx)

    const logs = await prisma.emailLog.findMany({ where: { recipient: email } })
    expect(logs).toHaveLength(0)
  })

  it('reports duplicate registration as a conflict', async () => {
    const email = uniqueEmail('duplicate')
    await createCustomerUser({ email })

    await expect(
      register({ email, password: TEST_PASSWORD, marketingOptIn: false }, ctx),
    ).rejects.toBeInstanceOf(EmailTakenError)
  })

  it('verifies an email token exactly once', async () => {
    const user = await createCustomerUser({
      email: uniqueEmail('verify'),
      emailVerified: false,
      status: 'PENDING_VERIFICATION',
    })
    const token = await issueToken({
      type: 'EMAIL_VERIFY',
      userId: user.id,
      identifier: user.email,
      ttlMs: 60_000,
      maxAttempts: 1,
    })

    await verifyEmail(token.token, ctx)
    const verified = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(verified.emailVerifiedAt).not.toBeNull()
    expect(verified.status).toBe('ACTIVE')

    await expect(verifyEmail(token.token, ctx)).rejects.toBeInstanceOf(OtpError)
  })
})

describe('login, lockout and sessions', () => {
  it('signs in, validates an opaque session and revokes it on logout', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('login') })

    const result = await login({ email: user.email!, password: TEST_PASSWORD }, ctx)
    expect(result.status).toBe('authenticated')
    if (result.status !== 'authenticated') throw new Error('expected authenticated')

    expect(result.session.kind).toBe('customer')
    expect(result.session.token).not.toBe(result.session.csrfToken)

    const stored = await prisma.session.findUniqueOrThrow({
      where: { id: result.session.sessionId },
    })
    expect(stored.tokenHash).toBe(hashToken(result.session.token))
    expect(stored.tokenHash).not.toBe(result.session.token)
    expect(stored.csrfTokenHash).not.toBe(result.session.csrfToken)

    const validated = await validateSessionToken(result.session.token)
    expect(validated?.actor.userId).toBe(user.id)
    expect(validated?.actor.isStaff).toBe(false)

    await logout(validated!, ctx)
    expect(await validateSessionToken(result.session.token)).toBeNull()
  })

  it('locks an account after repeated failures even with the right password', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('lock') })

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      resetCacheForTests()
      await expect(
        login({ email: user.email!, password: 'Definitely-Wrong-123!' }, ctx),
      ).rejects.toBeInstanceOf(UnauthenticatedError)
    }

    const locked = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(locked.lockedUntil).not.toBeNull()
    expect(locked.lockedUntil!.getTime()).toBeGreaterThan(Date.now())

    resetCacheForTests()
    await expect(
      login({ email: user.email!, password: TEST_PASSWORD }, ctx),
    ).rejects.toBeInstanceOf(AccountLockedError)
  })

  it('rate limits login attempts per IP and identity', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('ratelimit') })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        login({ email: user.email!, password: 'Wrong-Password-123!' }, ctx),
      ).rejects.toBeInstanceOf(UnauthenticatedError)
    }

    await expect(
      login({ email: user.email!, password: TEST_PASSWORD }, ctx),
    ).rejects.toBeInstanceOf(RateLimitError)
  })

  it('rotates sessions and invalidates the previous token and CSRF secret', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('rotate') })
    const first = await createSession(user.id, 'customer', ctx)
    const validated = await validateSessionToken(first.token)
    expect(validated).not.toBeNull()
    await assertCsrfToken(first.sessionId, first.csrfToken)

    const second = await rotateSession(validated!, ctx)
    expect(second.sessionId).not.toBe(first.sessionId)
    expect(second.token).not.toBe(first.token)
    expect(second.csrfToken).not.toBe(first.csrfToken)

    expect(await validateSessionToken(first.token)).toBeNull()
    expect(await validateSessionToken(second.token)).not.toBeNull()

    await expect(assertCsrfToken(first.sessionId, first.csrfToken)).rejects.toThrow()
    await expect(assertCsrfToken(second.sessionId, second.csrfToken)).resolves.toBeUndefined()
  })

  it('rejects missing and incorrect CSRF tokens', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('csrf') })
    const session = await createSession(user.id, 'customer', ctx)

    await expect(assertCsrfToken(session.sessionId, null)).rejects.toThrow(/verified/i)
    await expect(assertCsrfToken(session.sessionId, 'not-the-token')).rejects.toThrow(/verified/i)
    await expect(assertCsrfToken(session.sessionId, session.csrfToken)).resolves.toBeUndefined()
  })

  it('revokes every session for a user and on privilege changes', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('revoke-all') })
    const first = await createSession(user.id, 'customer', ctx)
    const second = await createSession(user.id, 'customer', ctx)

    const count = await revokeAllUserSessions(user.id)
    expect(count).toBe(2)
    expect(await validateSessionToken(first.token)).toBeNull()
    expect(await validateSessionToken(second.token)).toBeNull()

    const third = await createSession(user.id, 'customer', ctx)
    const revoked = await revokeSessionsForPrivilegeChange(user.id, null, ctx)
    expect(revoked).toBe(1)
    expect(await validateSessionToken(third.token)).toBeNull()
  })
})

describe('password reset and change', () => {
  it('resets a password once and revokes all sessions', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('reset') })
    const session = await createSession(user.id, 'customer', ctx)
    const token = await issueToken({
      type: 'PASSWORD_RESET',
      userId: user.id,
      identifier: user.email,
      ttlMs: 60_000,
      maxAttempts: 1,
    })

    const nextPassword = 'Another-Strong-Password-7!'
    await resetPassword(token.token, nextPassword, ctx)

    expect(await validateSessionToken(session.token)).toBeNull()
    await expect(
      login({ email: user.email!, password: TEST_PASSWORD }, ctx),
    ).rejects.toBeInstanceOf(UnauthenticatedError)

    resetCacheForTests()
    const result = await login({ email: user.email!, password: nextPassword }, ctx)
    expect(result.status).toBe('authenticated')

    // Replay of the same reset token must fail.
    await expect(
      resetPassword(token.token, 'Third-Strong-Password-8!', ctx),
    ).rejects.toBeInstanceOf(OtpError)
  })

  it('rotates the current session and revokes the others when changing password', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('change') })
    const current = await createSession(user.id, 'customer', ctx)
    const other = await createSession(user.id, 'customer', ctx)
    const validated = await validateSessionToken(current.token)

    const nextPassword = 'Changed-Strong-Password-4!'
    const rotated = await changePassword(validated!, TEST_PASSWORD, nextPassword, ctx)

    expect(await validateSessionToken(current.token)).toBeNull()
    expect(await validateSessionToken(other.token)).toBeNull()
    expect(await validateSessionToken(rotated.token)).not.toBeNull()
  })
})

describe('phone OTP', () => {
  it('creates an account from a verified phone number', async () => {
    const phone = uniquePhone()
    const token = await issueToken({
      type: 'PHONE_OTP',
      identifier: phone,
      ttlMs: 60_000,
      codeHash: hmacWithPepper('123456'),
      maxAttempts: 5,
    })

    const result = await verifyPhoneOtp({ phone, purpose: 'register', code: '123456' }, ctx)
    expect(result.status).toBe('authenticated')
    if (result.status !== 'authenticated') throw new Error('expected authenticated')
    expect(result.session.kind).toBe('customer')

    const user = await prisma.user.findFirstOrThrow({ where: { phone } })
    expect(user.phoneVerifiedAt).not.toBeNull()
    expect(user.status).toBe('ACTIVE')

    await expect(
      verifyPhoneOtp({ phone, purpose: 'register', code: '123456' }, ctx),
    ).rejects.toBeInstanceOf(OtpError)
    expect(token.id).toBeTruthy()
  })

  it('destroys an OTP after the maximum number of wrong attempts', async () => {
    const phone = uniquePhone()
    await issueToken({
      type: 'LOGIN_OTP',
      identifier: phone,
      ttlMs: 60_000,
      codeHash: hmacWithPepper('654321'),
      maxAttempts: 5,
    })

    for (let attempt = 0; attempt < 4; attempt += 1) {
      resetCacheForTests()
      await expect(
        verifyPhoneOtp({ phone, purpose: 'login', code: '000000' }, ctx),
      ).rejects.toBeInstanceOf(OtpError)
    }

    resetCacheForTests()
    await expect(
      verifyPhoneOtp({ phone, purpose: 'login', code: '000000' }, ctx),
    ).rejects.toBeInstanceOf(OtpError)

    // The fifth wrong attempt consumes the token; the correct code cannot revive it.
    resetCacheForTests()
    await expect(
      verifyPhoneOtp({ phone, purpose: 'login', code: '654321' }, ctx),
    ).rejects.toBeInstanceOf(OtpError)
  })

  it('accepts a valid OTP for an existing account', async () => {
    const phone = uniquePhone()
    await createCustomerUser({ phone, password: null, phoneVerified: false })
    await issueToken({
      type: 'LOGIN_OTP',
      identifier: phone,
      ttlMs: 60_000,
      codeHash: hmacWithPepper('111222'),
      maxAttempts: 5,
    })

    const result = await verifyPhoneOtp({ phone, purpose: 'login', code: '111222' }, ctx)
    expect(result.status).toBe('authenticated')

    const user = await prisma.user.findFirstOrThrow({ where: { phone } })
    expect(user.phoneVerifiedAt).not.toBeNull()
  })

  it('does not reveal account state when requesting an OTP', async () => {
    const phone = uniquePhone()
    await requestPhoneOtp({ phone, purpose: 'login' }, ctx)

    const tokens = await prisma.verificationToken.findMany({ where: { identifier: phone } })
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.codeHash).toMatch(/^[a-f0-9]{64}$/)
    // The raw code never reaches the database or logs.
    expect(JSON.stringify(tokens)).not.toMatch(/"\d{6}"/)
    const logs = await prisma.smsLog.findMany({ where: { recipient: phone } })
    expect(logs).toHaveLength(1)
  })
})

describe('session ownership (IDOR)', () => {
  it('cannot revoke another user session', async () => {
    const alice = await createCustomerUser({ email: uniqueEmail('alice') })
    const bob = await createCustomerUser({ email: uniqueEmail('bob') })
    const aliceSession = await createSession(alice.id, 'customer', ctx)
    const bobSession = await createSession(bob.id, 'customer', ctx)
    const aliceActor = (await validateSessionToken(aliceSession.token))!.actor

    await expect(revokeOwnSession(aliceActor, bobSession.sessionId, ctx)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(await validateSessionToken(bobSession.token)).not.toBeNull()

    const aliceSessions = await listSessionsForActor(aliceActor)
    expect(aliceSessions.map((session) => session.id)).toEqual([aliceSession.sessionId])
  })

  it('lists all active sessions with the current one marked', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('sessions') })
    const first = await createSession(user.id, 'customer', ctx)
    const second = await createSession(user.id, 'customer', ctx)

    const sessions = await listUserSessions(user.id, first.sessionId)
    expect(sessions).toHaveLength(2)
    expect(sessions.find((session) => session.current)?.id).toBe(first.sessionId)
    expect(sessions.some((session) => session.id === second.sessionId)).toBe(true)
  })
})

describe('RBAC and privilege escalation', () => {
  it('rejects customer and unprivileged staff access, allows granted permissions', async () => {
    const customer = await createCustomerUser({ email: uniqueEmail('customer-rbac') })
    const customerSession = await createSession(customer.id, 'customer', ctx)
    const customerActor = (await validateSessionToken(customerSession.token))!.actor

    expect(() => assertStaff(customerActor)).toThrow(ForbiddenError)
    expect(() => assertPermission(customerActor, 'dashboard:read')).toThrow(ForbiddenError)
    expect(() => assertAnyPermission(customerActor, ['dashboard:read'])).toThrow(ForbiddenError)

    const staff = await createStaffUser({
      email: uniqueEmail('staff-rbac'),
      roles: ['CUSTOMER_SUPPORT'],
    })
    const staffSession = await createSession(staff.id, 'staff', ctx)
    const staffActor = (await validateSessionToken(staffSession.token))!.actor
    expect(staffActor.isStaff).toBe(true)
    expect(() => assertPermission(staffActor, 'dashboard:read')).toThrow(ForbiddenError)

    await grantPermission('CUSTOMER_SUPPORT', 'dashboard:read')
    const refreshed = (await validateSessionToken(staffSession.token))!.actor
    expect(() => assertPermission(refreshed, 'dashboard:read')).not.toThrow()

    const superAdmin = await createStaffUser({
      email: uniqueEmail('super'),
      roles: ['SUPER_ADMIN'],
    })
    const superSession = await createSession(superAdmin.id, 'staff', ctx)
    const superActor = (await validateSessionToken(superSession.token))!.actor
    expect(superActor.isSuperAdmin).toBe(true)
    expect(superActor.permissions).toEqual(['*'])
    expect(() => assertPermission(superActor, 'dashboard:read')).not.toThrow()
  })

  it('does not let a staff session be created for a customer role set', async () => {
    const user = await createCustomerUser({ email: uniqueEmail('kind') })
    // Explicitly asking for a staff session does not grant staff authorization.
    const session = await createSession(user.id, 'staff', ctx)
    const actor = (await validateSessionToken(session.token))!.actor
    expect(actor.isStaff).toBe(false)
    expect(() => assertStaff(actor)).toThrow(ForbiddenError)
  })
})

describe('admin MFA', () => {
  it('requires setup, then TOTP verification, and accepts recovery codes once', async () => {
    const staff = await createStaffUser({
      email: uniqueEmail('mfa'),
      roles: ['ADMIN'],
    })

    resetCacheForTests()
    const firstLogin = await login({ email: staff.email!, password: TEST_PASSWORD }, ctx)
    expect(firstLogin.status).toBe('mfa_required')
    if (firstLogin.status !== 'mfa_required') throw new Error('expected mfa challenge')
    expect(firstLogin.setupRequired).toBe(true)

    resetCacheForTests()
    const setup = await prepareMfaSetup(firstLogin.challengeToken, ctx)
    expect(setup.secret).toMatch(/^[A-Z2-7]+$/)
    expect(setup.recoveryCodes).toHaveLength(10)

    const code = await generate({ secret: setup.secret })
    resetCacheForTests()
    const enabled = await enableMfa(firstLogin.challengeToken, code, ctx)
    expect(enabled.status).toBe('authenticated')
    if (enabled.status !== 'authenticated') throw new Error('expected authenticated')
    expect(enabled.session.kind).toBe('staff')

    const stored = await prisma.mfaCredential.findUniqueOrThrow({ where: { userId: staff.id } })
    expect(stored.enabledAt).not.toBeNull()
    expect(stored.secretEncrypted).not.toContain(setup.secret)

    resetCacheForTests()
    const secondLogin = await login({ email: staff.email!, password: TEST_PASSWORD }, ctx)
    expect(secondLogin.status).toBe('mfa_required')
    if (secondLogin.status !== 'mfa_required') throw new Error('expected mfa challenge')
    expect(secondLogin.setupRequired).toBe(false)

    resetCacheForTests()
    const verified = await verifyMfa(
      secondLogin.challengeToken,
      await generate({ secret: setup.secret }),
      ctx,
    )
    expect(verified.status).toBe('authenticated')

    const recoveryCode = setup.recoveryCodes[0]!
    resetCacheForTests()
    const thirdLogin = await login({ email: staff.email!, password: TEST_PASSWORD }, ctx)
    if (thirdLogin.status !== 'mfa_required') throw new Error('expected mfa challenge')

    resetCacheForTests()
    const recovered = await verifyMfa(thirdLogin.challengeToken, recoveryCode, ctx)
    expect(recovered.status).toBe('authenticated')

    resetCacheForTests()
    const fourthLogin = await login({ email: staff.email!, password: TEST_PASSWORD }, ctx)
    if (fourthLogin.status !== 'mfa_required') throw new Error('expected mfa challenge')

    resetCacheForTests()
    await expect(verifyMfa(fourthLogin.challengeToken, recoveryCode, ctx)).rejects.toThrow()
  })
})
