import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Actor } from '@/lib/auth/sessions'
import { ForbiddenError } from '@/lib/errors'

const mocks = vi.hoisted(() => ({
  requirePermissionActor: vi.fn(),
}))

vi.mock('@/lib/auth/guards', () => ({
  requirePermissionActor: mocks.requirePermissionActor,
}))

const { GET } = await import('@/app/api/v1/admin/whoami/route')

function actor(overrides: Partial<Actor> = {}): Actor {
  return {
    userId: 'user_1',
    sessionId: 'session_1',
    email: 'admin@example.com',
    phone: null,
    firstName: 'Admin',
    lastName: 'User',
    roles: ['ADMIN'],
    permissions: ['dashboard:read'],
    isStaff: true,
    isSuperAdmin: false,
    mfaEnabled: true,
    emailVerified: true,
    phoneVerified: false,
    preferredLanguage: 'en-IN',
    ...overrides,
  }
}

beforeEach(() => {
  mocks.requirePermissionActor.mockReset()
})

describe('GET /api/v1/admin/whoami', () => {
  it('returns 403 when the session lacks dashboard:read', async () => {
    mocks.requirePermissionActor.mockRejectedValue(new ForbiddenError())

    const response = await GET()
    const body = (await response.json()) as { code?: string }

    expect(response.status).toBe(403)
    expect(body.code).toBe('FORBIDDEN')
    expect(mocks.requirePermissionActor).toHaveBeenCalledWith('dashboard:read')
  })

  it('returns 401 for an anonymous request', async () => {
    const { UnauthenticatedError } = await import('@/lib/errors')
    mocks.requirePermissionActor.mockRejectedValue(new UnauthenticatedError())

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns the public actor when permission is granted', async () => {
    mocks.requirePermissionActor.mockResolvedValue(actor())

    const response = await GET()
    const body = (await response.json()) as {
      actor?: { userId?: string; permissions?: string[]; passwordHash?: unknown }
    }

    expect(response.status).toBe(200)
    expect(body.actor?.userId).toBe('user_1')
    expect(body.actor?.permissions).toEqual(['dashboard:read'])
    expect(body.actor).not.toHaveProperty('passwordHash')
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
})
