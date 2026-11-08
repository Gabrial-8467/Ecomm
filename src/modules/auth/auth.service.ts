import 'server-only'

import { AUDIT_EVENTS, audit } from '@/lib/auth/audit'
import {
  decryptSecret,
  encryptSecret,
  hashToken,
  hmacWithPepper,
  randomNumericCode,
  verifyHmacWithPepper,
} from '@/lib/crypto'
import { getEnv } from '@/lib/env'
import {
  AccountLockedError,
  AppError,
  ConflictError,
  EmailNotVerifiedError,
  EmailTakenError,
  MfaInvalidError,
  NotFoundError,
  OtpError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from '@/lib/errors'
import { findRecoveryCode, generateMfaCredential, verifyTotp } from '@/lib/auth/mfa'
import {
  assertPasswordPolicy,
  hashPassword,
  passwordNeedsRehash,
  verifyAgainstDummyPassword,
  verifyPassword,
} from '@/lib/auth/passwords'
import { enforceRateLimits, type RateLimitRule } from '@/lib/auth/rate-limit'
import {
  createSession,
  listUserSessions,
  revokeAllUserSessions,
  revokeSession,
  rotateSession,
  sessionKindForRoles,
  validateSessionToken,
  type Actor,
  type IssuedSession,
  type SessionContext,
  type ValidatedSession,
} from '@/lib/auth/sessions'
import {
  consumeToken,
  findActiveToken,
  findLatestOtp,
  incrementTokenAttempts,
  invalidateTokens,
  issueToken,
} from '@/lib/auth/tokens'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/notifications/email'
import { sendSms } from '@/lib/notifications/sms'
import { otpSms, passwordResetEmail, verificationEmail } from '@/lib/notifications/templates'
import { ROLES } from '@/lib/permissions'
import {
  createCustomer,
  emailExists,
  enableMfaCredential,
  findMfaCredential,
  findUserByEmail,
  findUserById,
  findUserByPhone,
  markLoginSuccess,
  recordFailedLogin,
  setEmailVerified,
  setPhoneVerified,
  updateCustomerProfile,
  updateMfaLastUsed,
  updateMfaRecoveryHashes,
  updatePassword,
  upsertMfaCredential,
  type AuthUser,
} from '@/modules/auth/auth.repository'
import type {
  LoginInput,
  OtpRequestInput,
  OtpVerifyInput,
  ProfileUpdateInput,
  RegisterInput,
} from '@/modules/auth/auth.schema'

export interface AuthContext extends SessionContext {
  requestId?: string | null
}

export interface IssuedSessionView {
  sessionId: string
  token: string
  csrfToken: string
  kind: 'customer' | 'staff'
  maxAgeSeconds: number
}

export type LoginResult =
  | {
      status: 'authenticated'
      actor: Actor
      session: IssuedSessionView
    }
  | {
      status: 'mfa_required'
      challengeToken: string
      setupRequired: boolean
      expiresAt: Date
    }

export interface MfaSetupView {
  secret: string
  otpauthUrl: string
  recoveryCodes: string[]
  expiresAt: Date
}

interface RateLimitedContext {
  ip?: string | null
  requestId?: string | null
  userAgent?: string | null
}

async function enforceAuthRateLimits(
  rules: readonly RateLimitRule[],
  context: RateLimitedContext,
  event: (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS] = AUDIT_EVENTS.authRateLimited,
): Promise<void> {
  try {
    await enforceRateLimits(rules)
  } catch (error) {
    if (error instanceof RateLimitError) {
      await audit({
        action: event,
        actorType: 'GUEST',
        entityType: 'RateLimit',
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        after: { rules: rules.map((rule) => ({ bucket: rule.bucket, limit: rule.limit })) },
      })
    }
    throw error
  }
}

function roleCodes(user: AuthUser): string[] {
  return user.userRoles.map((row) => row.role.code)
}

function staffMfaRequired(user: AuthUser): boolean {
  const env = getEnv()
  if (!env.ADMIN_MFA_REQUIRED) return false
  if (!user.adminProfile) return false
  const roles = roleCodes(user)
  const mandatory = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.ADMIN)
  return mandatory || user.adminProfile.isMfaRequired
}

function displayName(user: AuthUser): string | null {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || null
}

function toSessionView(session: IssuedSession): IssuedSessionView {
  return {
    sessionId: session.sessionId,
    token: session.token,
    csrfToken: session.csrfToken,
    kind: session.kind,
    maxAgeSeconds: session.maxAgeSeconds,
  }
}

async function finishLogin(
  user: AuthUser,
  kind: 'customer' | 'staff',
  context: AuthContext,
): Promise<LoginResult> {
  const session = await createSession(user.id, kind, context)
  const validated = await validateSessionToken(session.token)
  if (!validated) throw new AppError('Unable to create a session.', { status: 500 })

  await audit({
    action: AUDIT_EVENTS.authLoginSucceeded,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    after: { sessionId: session.sessionId, kind },
  })

  return {
    status: 'authenticated',
    actor: validated.actor,
    session: toSessionView(session),
  }
}

async function issueMfaChallenge(
  user: AuthUser,
  setupRequired: boolean,
  context: AuthContext,
): Promise<LoginResult> {
  const env = getEnv()
  const token = await issueToken({
    type: 'LOGIN_OTP',
    userId: user.id,
    identifier: `mfa:${setupRequired ? 'setup' : 'verify'}:${user.id}`,
    ttlMs: env.MFA_CHALLENGE_TTL_MINUTES * 60_000,
    ip: context.ip,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
  })

  await audit({
    action: AUDIT_EVENTS.authLoginMfaRequired,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    after: { setupRequired },
  })

  return {
    status: 'mfa_required',
    challengeToken: token.token,
    setupRequired,
    expiresAt: token.expiresAt,
  }
}

async function passwordLogin(
  user: AuthUser,
  password: string,
  passwordHash: string | null,
  kind: 'customer' | 'staff',
  context: AuthContext,
): Promise<LoginResult> {
  if (!passwordHash || !(await verifyPassword(passwordHash, password))) {
    await passwordLoginFailure(user.id, context)
    throw new UnauthenticatedError('Email or password is incorrect.')
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await audit({
      action: AUDIT_EVENTS.authLoginLocked,
      actorId: user.id,
      entityType: 'User',
      entityId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      after: { lockedUntil: user.lockedUntil.toISOString() },
    })
    throw new AccountLockedError()
  }

  if (user.status === 'SUSPENDED' || user.status === 'DELETED' || user.deletedAt) {
    await passwordLoginFailure(user.id, context)
    throw new UnauthenticatedError('Email or password is incorrect.')
  }

  if (user.email && !user.emailVerifiedAt) {
    throw new EmailNotVerifiedError()
  }

  if (user.status !== 'ACTIVE') {
    throw new UnauthenticatedError('Email or password is incorrect.')
  }

  const rehashed = passwordNeedsRehash(passwordHash) ? await hashPassword(password) : undefined

  await markLoginSuccess(user.id, rehashed)

  if (staffMfaRequired(user)) {
    const credential = await findMfaCredential(user.id)
    return issueMfaChallenge(user, !credential?.enabledAt, context)
  }

  return finishLogin(user, kind, context)
}

async function passwordLoginFailure(userId: string, context: AuthContext): Promise<void> {
  const env = getEnv()
  const result = await recordFailedLogin(
    userId,
    env.AUTH_MAX_FAILED_LOGINS,
    env.AUTH_LOCK_MINUTES * 60_000,
  )

  await audit({
    action: result.lockedUntil ? AUDIT_EVENTS.authLoginLocked : AUDIT_EVENTS.authLoginFailed,
    actorId: userId,
    entityType: 'User',
    entityId: userId,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    after: {
      failedAttempts: result.attempts,
      lockedUntil: result.lockedUntil?.toISOString() ?? null,
    },
  })
}

export async function register(input: RegisterInput, context: AuthContext): Promise<void> {
  const env = getEnv()
  await enforceAuthRateLimits(
    [
      {
        bucket: 'register:ip',
        identifier: context.ip ?? 'unknown',
        limit: 5,
        windowSeconds: 3_600,
      },
      { bucket: 'register:email', identifier: input.email, limit: 3, windowSeconds: 3_600 },
    ],
    context,
  )

  assertPasswordPolicy(input.password, {
    email: input.email,
    name: [input.firstName, input.lastName].filter(Boolean).join(' '),
  })

  if (await emailExists(input.email)) throw new EmailTakenError()

  const passwordHash = await hashPassword(input.password)
  const user = await createCustomer({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    marketingOptIn: input.marketingOptIn,
    status: 'PENDING_VERIFICATION',
  })

  await invalidateTokens({ type: 'EMAIL_VERIFY', userId: user.id })
  const token = await issueToken({
    type: 'EMAIL_VERIFY',
    userId: user.id,
    identifier: input.email,
    ttlMs: env.EMAIL_VERIFY_TTL_HOURS * 60 * 60_000,
    ip: context.ip,
    maxAttempts: 1,
  })

  const email = verificationEmail({ token: token.token, name: input.firstName })
  await sendEmail({ to: input.email, ...email })

  await audit({
    action: AUDIT_EVENTS.authRegister,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    after: { status: user.status, emailVerificationSent: true },
  })
}

export async function login(input: LoginInput, context: AuthContext): Promise<LoginResult> {
  await enforceAuthRateLimits(
    [
      { bucket: 'login:ip', identifier: context.ip ?? 'unknown', limit: 5, windowSeconds: 60 },
      { bucket: 'login:identity', identifier: input.email, limit: 5, windowSeconds: 60 },
      {
        bucket: 'login:ip-hour',
        identifier: context.ip ?? 'unknown',
        limit: 20,
        windowSeconds: 3_600,
      },
    ],
    context,
  )

  const user = await findUserByEmail(input.email)
  if (!user?.passwordHash) {
    await verifyAgainstDummyPassword(input.password)
    await audit({
      action: AUDIT_EVENTS.authLoginFailed,
      actorType: 'GUEST',
      entityType: 'User',
      entityId: null,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      after: { identityHash: hashToken(input.email), reason: 'unknown_identity' },
    })
    throw new UnauthenticatedError('Email or password is incorrect.')
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await audit({
      action: AUDIT_EVENTS.authLoginLocked,
      actorId: user.id,
      entityType: 'User',
      entityId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      after: { lockedUntil: user.lockedUntil.toISOString() },
    })
    throw new AccountLockedError()
  }

  return passwordLogin(
    user,
    input.password,
    user.passwordHash,
    sessionKindForRoles(roleCodes(user)),
    context,
  )
}

export async function logout(session: ValidatedSession, context: AuthContext): Promise<void> {
  await revokeSession(session.actor.sessionId, { userId: session.actor.userId })
  await audit({
    action: AUDIT_EVENTS.authLogout,
    actorId: session.actor.userId,
    entityType: 'Session',
    entityId: session.actor.sessionId,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })
}

export async function verifyEmail(token: string, context: AuthContext): Promise<void> {
  await enforceAuthRateLimits(
    [
      {
        bucket: 'email-verify:ip',
        identifier: context.ip ?? 'unknown',
        limit: 10,
        windowSeconds: 60,
      },
    ],
    context,
  )

  const row = await findActiveToken(token, 'EMAIL_VERIFY')
  if (!row?.userId)
    throw new OtpError('OTP_EXPIRED', 'This verification link is invalid or has expired.')
  if (!(await consumeToken(row.id))) {
    throw new OtpError('OTP_EXPIRED', 'This verification link is invalid or has expired.')
  }

  await setEmailVerified(row.userId)
  await audit({
    action: AUDIT_EVENTS.authEmailVerified,
    actorId: row.userId,
    entityType: 'User',
    entityId: row.userId,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })
}

export async function resendVerification(email: string, context: AuthContext): Promise<void> {
  const env = getEnv()
  await enforceAuthRateLimits(
    [
      {
        bucket: 'email-resend:ip',
        identifier: context.ip ?? 'unknown',
        limit: 5,
        windowSeconds: 60,
      },
      { bucket: 'email-resend:email', identifier: email, limit: 5, windowSeconds: 60 },
    ],
    context,
  )

  const user = await findUserByEmail(email)
  if (!user || user.emailVerifiedAt || user.status === 'DELETED') return

  await invalidateTokens({ type: 'EMAIL_VERIFY', userId: user.id })
  const token = await issueToken({
    type: 'EMAIL_VERIFY',
    userId: user.id,
    identifier: email,
    ttlMs: env.EMAIL_VERIFY_TTL_HOURS * 60 * 60_000,
    ip: context.ip,
    maxAttempts: 1,
  })
  await sendEmail({ to: email, ...verificationEmail({ token: token.token, name: user.firstName }) })
  await audit({
    action: AUDIT_EVENTS.authEmailVerificationRequested,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })
}

export async function requestPhoneOtp(input: OtpRequestInput, context: AuthContext): Promise<void> {
  const env = getEnv()
  await enforceAuthRateLimits(
    [
      { bucket: 'otp:phone', identifier: input.phone, limit: 5, windowSeconds: 60 },
      { bucket: 'otp:ip', identifier: context.ip ?? 'unknown', limit: 5, windowSeconds: 60 },
      {
        bucket: 'otp:ip-hour',
        identifier: context.ip ?? 'unknown',
        limit: 20,
        windowSeconds: 3_600,
      },
    ],
    context,
  )

  const user = await findUserByPhone(input.phone)
  if (user?.status === 'SUSPENDED' || user?.status === 'DELETED' || user?.deletedAt) {
    // Do not disclose account state. The request still gets a generic 202.
    return
  }

  const type = input.purpose === 'login' ? 'LOGIN_OTP' : 'PHONE_OTP'
  const code = randomNumericCode(6)
  await invalidateTokens({ type, identifier: input.phone })
  await issueToken({
    type,
    userId: user?.id ?? null,
    identifier: input.phone,
    ttlMs: env.OTP_TTL_MINUTES * 60_000,
    codeHash: hmacWithPepper(code),
    ip: context.ip,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
  })

  const message = otpSms({ code, minutes: env.OTP_TTL_MINUTES })
  await sendSms({ to: input.phone, ...message })

  await audit({
    action: AUDIT_EVENTS.authOtpRequested,
    actorId: user?.id ?? null,
    actorType: user ? 'USER' : 'GUEST',
    entityType: 'PhoneOtp',
    entityId: null,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    after: { purpose: input.purpose },
  })
}

export async function verifyPhoneOtp(
  input: OtpVerifyInput,
  context: AuthContext,
): Promise<LoginResult> {
  await enforceAuthRateLimits(
    [
      { bucket: 'otp-verify:phone', identifier: input.phone, limit: 10, windowSeconds: 60 },
      {
        bucket: 'otp-verify:ip',
        identifier: context.ip ?? 'unknown',
        limit: 10,
        windowSeconds: 60,
      },
    ],
    context,
    AUDIT_EVENTS.authOtpFailed,
  )

  const type = input.purpose === 'login' ? 'LOGIN_OTP' : 'PHONE_OTP'
  const row = await findLatestOtp(input.phone, type)
  if (!row) throw new OtpError('OTP_EXPIRED')

  if (row.attempts >= row.maxAttempts) {
    await consumeToken(row.id)
    throw new OtpError('OTP_EXPIRED')
  }

  if (!row.codeHash || !verifyHmacWithPepper(input.code, row.codeHash)) {
    const attempts = await incrementTokenAttempts(row.id)
    if (attempts >= row.maxAttempts) await consumeToken(row.id)
    await audit({
      action: AUDIT_EVENTS.authOtpFailed,
      actorId: row.userId,
      actorType: row.userId ? 'USER' : 'GUEST',
      entityType: 'PhoneOtp',
      entityId: row.id,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      after: { attempts },
    })
    throw new OtpError('OTP_INVALID')
  }

  if (!(await consumeToken(row.id))) throw new OtpError('OTP_EXPIRED')

  let user = await findUserByPhone(input.phone)
  if (!user) {
    user = await createCustomer({
      phone: input.phone,
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
    })
  } else {
    if (user.status === 'SUSPENDED' || user.status === 'DELETED' || user.deletedAt) {
      throw new UnauthenticatedError('This account cannot sign in.')
    }
    await setPhoneVerified(user.id)
    user = (await findUserByPhone(input.phone)) ?? user
  }

  await audit({
    action: AUDIT_EVENTS.authOtpSucceeded,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })

  if (staffMfaRequired(user)) {
    const credential = await findMfaCredential(user.id)
    return issueMfaChallenge(user, !credential?.enabledAt, context)
  }

  await markLoginSuccess(user.id)
  return finishLogin(user, sessionKindForRoles(roleCodes(user)), context)
}

export async function requestPasswordReset(email: string, context: AuthContext): Promise<void> {
  const env = getEnv()
  await enforceAuthRateLimits(
    [
      {
        bucket: 'password-forgot:ip',
        identifier: context.ip ?? 'unknown',
        limit: 5,
        windowSeconds: 60,
      },
      { bucket: 'password-forgot:email', identifier: email, limit: 5, windowSeconds: 60 },
      {
        bucket: 'password-forgot:ip-hour',
        identifier: context.ip ?? 'unknown',
        limit: 20,
        windowSeconds: 3_600,
      },
    ],
    context,
  )

  const user = await findUserByEmail(email)
  if (!user || user.status === 'DELETED' || user.deletedAt) return

  await invalidateTokens({ type: 'PASSWORD_RESET', userId: user.id })
  const token = await issueToken({
    type: 'PASSWORD_RESET',
    userId: user.id,
    identifier: email,
    ttlMs: env.PASSWORD_RESET_TTL_MINUTES * 60_000,
    ip: context.ip,
    maxAttempts: 1,
  })
  await sendEmail({
    to: email,
    ...passwordResetEmail({ token: token.token, name: user.firstName }),
  })

  await audit({
    action: AUDIT_EVENTS.authPasswordResetRequested,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })
}

export async function resetPassword(
  token: string,
  password: string,
  context: AuthContext,
): Promise<void> {
  await enforceAuthRateLimits(
    [
      {
        bucket: 'password-reset:ip',
        identifier: context.ip ?? 'unknown',
        limit: 10,
        windowSeconds: 60,
      },
    ],
    context,
  )

  const row = await findActiveToken(token, 'PASSWORD_RESET')
  if (!row?.userId) throw new OtpError('OTP_EXPIRED', 'This reset link is invalid or has expired.')

  const user = await findUserById(row.userId)
  if (!user || user.status === 'DELETED' || user.deletedAt) {
    throw new OtpError('OTP_EXPIRED', 'This reset link is invalid or has expired.')
  }

  assertPasswordPolicy(password, {
    staff: Boolean(user.adminProfile),
    email: user.email,
    name: displayName(user),
  })

  if (!(await consumeToken(row.id))) {
    throw new OtpError('OTP_EXPIRED', 'This reset link is invalid or has expired.')
  }

  const passwordHash = await hashPassword(password)
  await updatePassword(user.id, passwordHash)
  await revokeAllUserSessions(user.id)

  await audit({
    action: AUDIT_EVENTS.authPasswordResetCompleted,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })
}

export async function changePassword(
  session: ValidatedSession,
  currentPassword: string,
  newPassword: string,
  context: AuthContext,
): Promise<IssuedSession> {
  const user = await findUserById(session.actor.userId)
  if (!user?.passwordHash) throw new ValidationError('Your account does not use a password.')
  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new UnauthenticatedError('Your current password is incorrect.')
  }

  assertPasswordPolicy(newPassword, {
    staff: Boolean(user.adminProfile),
    email: user.email,
    name: displayName(user),
  })

  const passwordHash = await hashPassword(newPassword)
  await updatePassword(user.id, passwordHash)

  const next = await rotateSession(session, context)
  await revokeAllUserSessions(user.id, { exceptSessionId: next.sessionId })

  await audit({
    action: AUDIT_EVENTS.authPasswordChanged,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    after: { otherSessionsRevoked: true },
  })

  return next
}

export async function getMfaChallengeInfo(challengeToken: string): Promise<{
  setupRequired: boolean
  expiresAt: Date
  email: string | null
}> {
  const row = await findActiveToken(challengeToken, 'LOGIN_OTP')
  if (!row) throw new OtpError('OTP_EXPIRED')
  const parsed = parseMfaIdentifier(row.identifier)
  if (!parsed) throw new OtpError('OTP_EXPIRED')
  const user = await findUserById(parsed.userId)
  if (!user) throw new OtpError('OTP_EXPIRED')
  return {
    setupRequired: parsed.kind === 'setup',
    expiresAt: row.expiresAt,
    email: user.email,
  }
}

function parseMfaIdentifier(
  identifier: string | null,
): { kind: 'setup' | 'verify'; userId: string } | null {
  if (!identifier) return null
  const [prefix, kind, userId] = identifier.split(':')
  if (prefix !== 'mfa' || (kind !== 'setup' && kind !== 'verify') || !userId) return null
  return { kind, userId }
}

export async function prepareMfaSetup(
  challengeToken: string,
  context: AuthContext,
): Promise<MfaSetupView> {
  await enforceAuthRateLimits(
    [
      { bucket: 'mfa-setup:ip', identifier: context.ip ?? 'unknown', limit: 5, windowSeconds: 60 },
      { bucket: 'mfa-setup:token', identifier: challengeToken, limit: 5, windowSeconds: 60 },
    ],
    context,
  )

  const row = await findActiveToken(challengeToken, 'LOGIN_OTP')
  const parsed = parseMfaIdentifier(row?.identifier ?? null)
  if (!row || parsed?.kind !== 'setup') throw new OtpError('OTP_EXPIRED')

  const user = await findUserById(parsed.userId)
  if (!user) throw new OtpError('OTP_EXPIRED')

  const existing = await findMfaCredential(user.id)
  if (existing?.enabledAt) {
    throw new ConflictError('Authenticator-based sign-in is already enabled for this account.')
  }

  const credential = await generateMfaCredential(user.email ?? user.phone ?? user.id)
  await upsertMfaCredential({
    userId: user.id,
    secretEncrypted: encryptSecret(credential.secret),
    recoveryHashes: credential.recoveryHashes,
  })

  await audit({
    action: AUDIT_EVENTS.authMfaSetupStarted,
    actorId: user.id,
    entityType: 'MfaCredential',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })

  return {
    secret: credential.secret,
    otpauthUrl: credential.otpauthUrl,
    recoveryCodes: credential.recoveryCodes,
    expiresAt: row.expiresAt,
  }
}

export async function enableMfa(
  challengeToken: string,
  code: string,
  context: AuthContext,
): Promise<LoginResult> {
  await enforceAuthRateLimits(
    [
      {
        bucket: 'mfa-enable:ip',
        identifier: context.ip ?? 'unknown',
        limit: 10,
        windowSeconds: 60,
      },
      { bucket: 'mfa-enable:token', identifier: challengeToken, limit: 10, windowSeconds: 60 },
    ],
    context,
    AUDIT_EVENTS.authLoginMfaFailed,
  )

  const row = await findActiveToken(challengeToken, 'LOGIN_OTP')
  const parsed = parseMfaIdentifier(row?.identifier ?? null)
  if (!row || parsed?.kind !== 'setup') throw new OtpError('OTP_EXPIRED')
  if (row.attempts >= row.maxAttempts) throw new OtpError('OTP_EXPIRED')

  const user = await findUserById(parsed.userId)
  const credential = user ? await findMfaCredential(user.id) : null
  if (!user || !credential) throw new OtpError('OTP_EXPIRED')

  if (!(await verifyTotp(decryptSecret(credential.secretEncrypted), code))) {
    const attempts = await incrementTokenAttempts(row.id)
    if (attempts >= row.maxAttempts) await consumeToken(row.id)
    await audit({
      action: AUDIT_EVENTS.authLoginMfaFailed,
      actorId: user.id,
      entityType: 'MfaCredential',
      entityId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      after: { attempts, stage: 'setup' },
    })
    throw new MfaInvalidError()
  }

  if (!(await consumeToken(row.id))) throw new OtpError('OTP_EXPIRED')

  await enableMfaCredential(user.id)
  await markLoginSuccess(user.id)
  await audit({
    action: AUDIT_EVENTS.authMfaEnabled,
    actorId: user.id,
    entityType: 'MfaCredential',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })

  return finishLogin(user, sessionKindForRoles(roleCodes(user)), context)
}

export async function verifyMfa(
  challengeToken: string,
  code: string,
  context: AuthContext,
): Promise<LoginResult> {
  await enforceAuthRateLimits(
    [
      {
        bucket: 'mfa-verify:ip',
        identifier: context.ip ?? 'unknown',
        limit: 10,
        windowSeconds: 60,
      },
      { bucket: 'mfa-verify:token', identifier: challengeToken, limit: 10, windowSeconds: 60 },
    ],
    context,
    AUDIT_EVENTS.authLoginMfaFailed,
  )

  const row = await findActiveToken(challengeToken, 'LOGIN_OTP')
  const parsed = parseMfaIdentifier(row?.identifier ?? null)
  if (!row || parsed?.kind !== 'verify') throw new OtpError('OTP_EXPIRED')
  if (row.attempts >= row.maxAttempts) throw new OtpError('OTP_EXPIRED')

  const user = await findUserById(parsed.userId)
  const credential = user ? await findMfaCredential(user.id) : null
  if (!user || !credential?.enabledAt) throw new OtpError('OTP_EXPIRED')

  const totpValid = await verifyTotp(decryptSecret(credential.secretEncrypted), code)
  let recoveryHashes: string[] = []

  if (!totpValid) {
    const stored = Array.isArray(credential.backupCodesHashed)
      ? (credential.backupCodesHashed as unknown[]).filter(
          (value): value is string => typeof value === 'string',
        )
      : []
    const index = await findRecoveryCode(stored, code)
    if (index === -1) {
      const attempts = await incrementTokenAttempts(row.id)
      if (attempts >= row.maxAttempts) await consumeToken(row.id)
      await audit({
        action: AUDIT_EVENTS.authLoginMfaFailed,
        actorId: user.id,
        entityType: 'MfaCredential',
        entityId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        after: { attempts, stage: 'verify' },
      })
      throw new MfaInvalidError()
    }
    recoveryHashes = stored.filter((_, position) => position !== index)
  }

  if (!(await consumeToken(row.id))) throw new OtpError('OTP_EXPIRED')

  if (recoveryHashes.length > 0) {
    await updateMfaRecoveryHashes(user.id, recoveryHashes)
  } else {
    await updateMfaLastUsed(user.id)
  }

  await markLoginSuccess(user.id)
  await audit({
    action: AUDIT_EVENTS.authLoginMfaSucceeded,
    actorId: user.id,
    entityType: 'User',
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    after: { method: totpValid ? 'totp' : 'recovery_code' },
  })

  return finishLogin(user, sessionKindForRoles(roleCodes(user)), context)
}

export async function updateProfile(actor: Actor, input: ProfileUpdateInput): Promise<void> {
  await updateCustomerProfile(actor.userId, input)
}

export async function getAccountProfile(actor: Actor) {
  const user = await findUserById(actor.userId)
  if (!user) throw new NotFoundError('Account not found.')
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    phoneVerifiedAt: user.phoneVerifiedAt,
    marketingOptIn: user.marketingOptIn,
    preferredLanguage: user.customerProfile?.preferredLanguage ?? 'en-IN',
    mfaEnabled: Boolean(user.mfaCredential?.enabledAt),
    hasPassword: Boolean(user.passwordHash),
    staff: Boolean(user.adminProfile),
    roles: roleCodes(user),
  }
}

export async function listSessionsForActor(actor: Actor) {
  return listUserSessions(actor.userId, actor.sessionId)
}

export async function revokeOwnSession(
  actor: Actor,
  sessionId: string,
  context: AuthContext,
): Promise<void> {
  const revoked = await revokeSession(sessionId, { userId: actor.userId })
  if (!revoked) throw new NotFoundError('Session not found.')
  await audit({
    action: AUDIT_EVENTS.authSessionRevoked,
    actorId: actor.userId,
    entityType: 'Session',
    entityId: sessionId,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
  })
}

/**
 * Called by user/RBAC administration whenever roles or permissions change.
 * Forces the affected user to sign in again with the new authorization.
 */
export async function revokeSessionsForPrivilegeChange(
  userId: string,
  actorId: string | null,
  context: AuthContext,
): Promise<number> {
  const count = await revokeAllUserSessions(userId)
  await audit({
    action: AUDIT_EVENTS.authPrivilegeChanged,
    actorId,
    entityType: 'User',
    entityId: userId,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    after: { sessionsRevoked: count },
  })
  return count
}

/** Used by smoke tests and operational diagnostics; never returns credentials. */
export function safeAuthError(error: unknown): { code: string; message: string } {
  if (error instanceof AppError) return { code: error.code, message: error.message }
  if (error instanceof Error) {
    logger.warn({ err: error }, 'unexpected authentication error')
  }
  return { code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
}
