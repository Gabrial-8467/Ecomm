import 'server-only'

import { cache } from 'react'

import { readAuthCookies, readCsrfCookie, type SessionKind } from '@/lib/auth/cookies'
import {
  assertAnyPermission as assertAnyPermissionForActor,
  assertCsrfToken,
  assertPermission as assertPermissionForActor,
  assertStaff as assertStaffForActor,
  requireActor as requireResolvedActor,
  validateSessionToken,
  type Actor,
  type ValidatedSession,
} from '@/lib/auth/sessions'
import { UnauthenticatedError } from '@/lib/errors'
import type { Permission } from '@/lib/permissions'

/** Resolve the current cookie session once per request/render pass. */
export const getCurrentSession = cache(async (): Promise<ValidatedSession | null> => {
  const cookie = await readAuthCookies()
  if (!cookie) return null
  return validateSessionToken(cookie.token)
})

export async function getCurrentActor(): Promise<Actor | null> {
  const session = await getCurrentSession()
  return session?.actor ?? null
}

export async function requireCurrentActor(): Promise<Actor> {
  return requireResolvedActor(await getCurrentActor())
}

export async function requireCurrentSession(): Promise<ValidatedSession> {
  const session = await getCurrentSession()
  if (!session) throw new UnauthenticatedError()
  return session
}

export async function requireStaffActor(): Promise<Actor> {
  const actor = await requireCurrentActor()
  assertStaffForActor(actor)
  return actor
}

export async function requirePermissionActor(permission: Permission): Promise<Actor> {
  const actor = await requireCurrentActor()
  assertPermissionForActor(actor, permission)
  return actor
}

export async function requireAnyPermissionActor(
  permissions: readonly Permission[],
): Promise<Actor> {
  const actor = await requireCurrentActor()
  assertAnyPermissionForActor(actor, permissions)
  return actor
}

/**
 * Verify the CSRF token on a cookie-authenticated mutation. Header-based API
 * routes pass `X-CSRF-Token`; server actions pass a hidden form field.
 */
export async function verifyCsrfForCurrentSession(
  submitted: string | null | undefined,
): Promise<void> {
  const session = await requireCurrentSession()
  await assertCsrfToken(session.actor.sessionId, submitted)
}

export async function csrfTokenForForm(kind?: SessionKind): Promise<string> {
  return (await readCsrfCookie(kind)) ?? ''
}
