import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { hashToken, randomToken, safeEqual } from '@/lib/crypto'
import { getEnv } from '@/lib/env'
import { CsrfError, ForbiddenError, SessionExpiredError, UnauthenticatedError } from '@/lib/errors'
import { hasPermission, type Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export type SessionKind = 'customer' | 'staff'

export interface Actor {
  userId: string
  sessionId: string
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  roles: string[]
  permissions: string[]
  isStaff: boolean
  isSuperAdmin: boolean
  mfaEnabled: boolean
  emailVerified: boolean
  phoneVerified: boolean
  preferredLanguage: string
}

export interface ValidatedSession {
  actor: Actor
  kind: SessionKind
  csrfTokenHash: string
  expiresAt: Date
}

export interface IssuedSession {
  sessionId: string
  token: string
  csrfToken: string
  kind: SessionKind
  maxAgeSeconds: number
  expiresAt: Date
}

export interface SessionContext {
  ip?: string | null
  userAgent?: string | null
  rotatedFromId?: string | null
}

const STAFF_ROLE_CODES = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'PRODUCT_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
  'CUSTOMER_SUPPORT',
  'FINANCE_MANAGER',
  'CONTENT_MANAGER',
])

export function sessionTimeouts(
  kind: SessionKind,
  now = new Date(),
): {
  idleMs: number
  absoluteMs: number
  absoluteExpiresAt: Date
  maxAgeSeconds: number
} {
  const env = getEnv()
  const idleMs =
    kind === 'staff'
      ? env.SESSION_IDLE_STAFF_MINUTES * 60_000
      : env.SESSION_IDLE_CUSTOMER_DAYS * 24 * 60 * 60_000
  const absoluteMs =
    kind === 'staff'
      ? env.SESSION_ABSOLUTE_STAFF_HOURS * 60 * 60_000
      : env.SESSION_ABSOLUTE_CUSTOMER_DAYS * 24 * 60 * 60_000

  return {
    idleMs,
    absoluteMs,
    absoluteExpiresAt: new Date(now.getTime() + absoluteMs),
    maxAgeSeconds: Math.floor(absoluteMs / 1_000),
  }
}

export function sessionKindForRoles(roles: readonly string[]): SessionKind {
  return roles.some((role) => STAFF_ROLE_CODES.has(role)) ? 'staff' : 'customer'
}

/**
 * Creates a new opaque session. Only SHA-256 hashes of the session and CSRF
 * tokens are persisted; the raw values leave this function exactly once.
 */
export async function createSession(
  userId: string,
  kind: SessionKind,
  context: SessionContext = {},
): Promise<IssuedSession> {
  const token = randomToken(32)
  const csrfToken = randomToken(32)
  const timeouts = sessionTimeouts(kind)

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      csrfTokenHash: hashToken(csrfToken),
      ip: context.ip ?? null,
      userAgent: context.userAgent?.slice(0, 512) ?? null,
      expiresAt: timeouts.absoluteExpiresAt,
      rotatedFromId: context.rotatedFromId ?? null,
    },
    select: { id: true },
  })

  return {
    sessionId: session.id,
    token,
    csrfToken,
    kind,
    maxAgeSeconds: timeouts.maxAgeSeconds,
    expiresAt: timeouts.absoluteExpiresAt,
  }
}

type SessionWithUser = Prisma.SessionGetPayload<{ include: typeof SESSION_INCLUDE }>

const SESSION_INCLUDE = {
  user: {
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
      adminProfile: true,
      mfaCredential: true,
      customerProfile: true,
    },
  },
} as const

async function findSessionByToken(token: string): Promise<SessionWithUser | null> {
  return prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: SESSION_INCLUDE,
  })
}

/**
 * Validates a raw session token. Returns null for missing, expired, revoked or
 * idle-timed-out sessions. Staff idle/absolute windows are shorter than
 * customer windows.
 */
export async function validateSessionToken(
  token: string | null | undefined,
  now = new Date(),
): Promise<ValidatedSession | null> {
  if (!token) return null

  const session = await findSessionByToken(token)
  if (!session) return null

  if (session.revokedAt || session.expiresAt.getTime() <= now.getTime()) {
    return null
  }

  const roles = session.user.userRoles.map((row) => row.role.code)
  const kind = sessionKindForRoles(roles)
  const timeouts = sessionTimeouts(kind, session.createdAt)

  if (timeouts.absoluteExpiresAt.getTime() <= now.getTime()) {
    await prisma.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now },
    })
    return null
  }

  if (session.lastSeenAt.getTime() + timeouts.idleMs <= now.getTime()) {
    await prisma.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now },
    })
    return null
  }

  const user = session.user
  if (user.status === 'SUSPENDED' || user.status === 'DELETED' || user.deletedAt) {
    await prisma.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now },
    })
    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now },
    })
    return null
  }

  // Sliding idle window: avoid a write on every request.
  if (now.getTime() - session.lastSeenAt.getTime() > 60_000) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: now },
    })
  }

  const isSuperAdmin = roles.includes('SUPER_ADMIN')
  const permissions = isSuperAdmin
    ? ['*']
    : [
        ...new Set(
          user.userRoles.flatMap((row) =>
            row.role.rolePermissions.map((grant) => grant.permission.code),
          ),
        ),
      ]

  const actor: Actor = {
    userId: user.id,
    sessionId: session.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    permissions,
    isStaff: kind === 'staff',
    isSuperAdmin,
    mfaEnabled: Boolean(user.mfaCredential?.enabledAt),
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    preferredLanguage: user.customerProfile?.preferredLanguage ?? 'en-IN',
  }

  return {
    actor,
    kind,
    csrfTokenHash: session.csrfTokenHash,
    expiresAt: session.expiresAt,
  }
}

export function verifyCsrfToken(
  csrfTokenHash: string,
  submitted: string | null | undefined,
): boolean {
  if (!submitted) return false
  return safeEqual(hashToken(submitted), csrfTokenHash)
}

export async function assertCsrfToken(
  sessionId: string,
  submitted: string | null | undefined,
): Promise<void> {
  if (!submitted) throw new CsrfError()
  const session = await prisma.session.findFirst({
    where: { id: sessionId, revokedAt: null },
    select: { csrfTokenHash: true },
  })
  if (!session || !verifyCsrfToken(session.csrfTokenHash, submitted)) {
    throw new CsrfError()
  }
}

export async function revokeSession(
  sessionId: string,
  options: { userId?: string } = {},
): Promise<boolean> {
  const result = await prisma.session.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
      ...(options.userId ? { userId: options.userId } : {}),
    },
    data: { revokedAt: new Date() },
  })
  return result.count > 0
}

export async function revokeAllUserSessions(
  userId: string,
  options: { exceptSessionId?: string } = {},
): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(options.exceptSessionId ? { id: { not: options.exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  })
  return result.count
}

/** Rotate a session, linking the replacement to the old row for auditability. */
export async function rotateSession(
  current: ValidatedSession,
  context: SessionContext = {},
): Promise<IssuedSession> {
  await revokeSession(current.actor.sessionId, { userId: current.actor.userId })
  return createSession(current.actor.userId, current.kind, {
    ...context,
    rotatedFromId: current.actor.sessionId,
  })
}

export async function listUserSessions(userId: string, currentSessionId?: string) {
  const sessions = await prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: 'desc' },
    select: {
      id: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
    },
  })
  return sessions.map((session) => ({
    ...session,
    current: session.id === currentSessionId,
  }))
}

export function assertStaff(actor: Actor): void {
  if (!actor.isStaff) throw new ForbiddenError()
}

export function assertPermission(actor: Actor, permission: Permission): void {
  if (!actor.isStaff || !hasPermission(actor.permissions, permission)) {
    throw new ForbiddenError()
  }
}

export function assertAnyPermission(actor: Actor, permissions: readonly Permission[]): void {
  if (
    !actor.isStaff ||
    !permissions.some((permission) => hasPermission(actor.permissions, permission))
  ) {
    throw new ForbiddenError()
  }
}

export function requireActor(actor: Actor | null | undefined): Actor {
  if (!actor) throw new UnauthenticatedError()
  return actor
}

export function requireVerifiedActor(actor: Actor | null | undefined): Actor {
  const resolved = requireActor(actor)
  if (!resolved.emailVerified && !resolved.phoneVerified) {
    throw new SessionExpiredError('Please verify your account before continuing.')
  }
  return resolved
}
