import 'server-only'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Security/audit event names. Keep these stable: they are queried by the
 * admin audit viewer and by alerting rules.
 */
export const AUDIT_EVENTS = {
  authRegister: 'auth.register',
  authLoginSucceeded: 'auth.login.succeeded',
  authLoginFailed: 'auth.login.failed',
  authLoginLocked: 'auth.login.locked',
  authLoginMfaRequired: 'auth.login.mfa_required',
  authLoginMfaSucceeded: 'auth.login.mfa_succeeded',
  authLoginMfaFailed: 'auth.login.mfa_failed',
  authLogout: 'auth.logout',
  authSessionRevoked: 'auth.session.revoked',
  authSessionsRevoked: 'auth.sessions.revoked',
  authEmailVerified: 'auth.email.verified',
  authEmailVerificationRequested: 'auth.email.verification_requested',
  authPasswordResetRequested: 'auth.password.reset_requested',
  authPasswordResetCompleted: 'auth.password.reset_completed',
  authPasswordChanged: 'auth.password.changed',
  authOtpRequested: 'auth.otp.requested',
  authOtpSucceeded: 'auth.otp.succeeded',
  authOtpFailed: 'auth.otp.failed',
  authMfaSetupStarted: 'auth.mfa.setup_started',
  authMfaEnabled: 'auth.mfa.enabled',
  authRateLimited: 'security.rate_limited',
  authCsrfFailed: 'security.csrf_failed',
  authPrivilegeChanged: 'auth.privilege.changed',
  catalogCategoryCreated: 'catalog.category.created',
  catalogCategoryUpdated: 'catalog.category.updated',
  catalogCategoryDeleted: 'catalog.category.deleted',
  catalogBrandCreated: 'catalog.brand.created',
  catalogBrandUpdated: 'catalog.brand.updated',
  catalogBrandDeleted: 'catalog.brand.deleted',
  catalogAttributeCreated: 'catalog.attribute.created',
  catalogAttributeUpdated: 'catalog.attribute.updated',
  catalogAttributeDeleted: 'catalog.attribute.deleted',
  catalogProductCreated: 'catalog.product.created',
  catalogProductUpdated: 'catalog.product.updated',
  catalogProductDeleted: 'catalog.product.deleted',
  catalogProductPublished: 'catalog.product.published',
  catalogProductArchived: 'catalog.product.archived',
  catalogVariantCreated: 'catalog.variant.created',
  catalogVariantUpdated: 'catalog.variant.updated',
  catalogVariantDeleted: 'catalog.variant.deleted',
  catalogPriceChanged: 'catalog.price.changed',
} as const

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS]

export interface AuditInput {
  action: AuditEvent
  actorId?: string | null
  actorType?: 'USER' | 'SYSTEM' | 'ADMIN' | 'GUEST'
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
  ip?: string | null
  userAgent?: string | null
  requestId?: string | null
}

/**
 * Append-only audit write. Audit failures must never break a user-facing
 * operation; they are logged loudly so monitoring can alert instead.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorType: input.actorType ?? 'USER',
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before === undefined ? undefined : (input.before as object),
        after: input.after === undefined ? undefined : (input.after as object),
        ip: input.ip ?? null,
        userAgent: input.userAgent?.slice(0, 512) ?? null,
        requestId: input.requestId ?? null,
      },
    })
  } catch (error) {
    logger.error({ err: error, action: input.action }, 'failed to write audit log')
  }
}
