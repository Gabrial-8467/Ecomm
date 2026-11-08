import type { Actor } from '@/lib/auth/sessions'

/** Safe JSON representation of the current actor for authenticated endpoints. */
export function publicActor(actor: Actor) {
  return {
    userId: actor.userId,
    email: actor.email,
    phone: actor.phone,
    firstName: actor.firstName,
    lastName: actor.lastName,
    roles: actor.roles,
    permissions: actor.permissions,
    isStaff: actor.isStaff,
    isSuperAdmin: actor.isSuperAdmin,
    mfaEnabled: actor.mfaEnabled,
    emailVerified: actor.emailVerified,
    phoneVerified: actor.phoneVerified,
    preferredLanguage: actor.preferredLanguage,
  }
}
