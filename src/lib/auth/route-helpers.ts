import 'server-only'

import { setAuthCookies } from '@/lib/auth/cookies'
import { verifyCsrfForCurrentSession } from '@/lib/auth/guards'
import { clearGuestToken } from '@/lib/guest-identity'
import { json } from '@/lib/http'
import { logger } from '@/lib/logger'
import { publicActor } from '@/modules/auth/auth.presenter'
import type { LoginResult } from '@/modules/auth/auth.service'
import { mergeGuestCartIntoUser } from '@/modules/cart/cart.service'
import { mergeGuestWishlistIntoUser } from '@/modules/wishlist/wishlist.service'

/**
 * Guest carts and wishlists follow a customer into their account after any
 * successful customer login (password, phone OTP or MFA). A merge failure must
 * never block the sign-in that already succeeded.
 */
async function mergeGuestDataIntoCustomer(result: LoginResult): Promise<void> {
  if (result.status !== 'authenticated' || result.session.kind !== 'customer') return
  try {
    await mergeGuestCartIntoUser(result.actor.userId)
    await mergeGuestWishlistIntoUser(result.actor.userId)
    await clearGuestToken()
  } catch (error) {
    logger.error({ err: error, userId: result.actor.userId }, 'guest data merge after login failed')
  }
}

export async function respondToLogin(result: LoginResult): Promise<Response> {
  if (result.status === 'authenticated') {
    await setAuthCookies({
      kind: result.session.kind,
      token: result.session.token,
      csrfToken: result.session.csrfToken,
      maxAgeSeconds: result.session.maxAgeSeconds,
    })
    await mergeGuestDataIntoCustomer(result)
    return json({
      status: 'authenticated',
      actor: publicActor(result.actor),
      csrfToken: result.session.csrfToken,
    })
  }

  return json({
    status: 'mfa_required',
    challengeToken: result.challengeToken,
    setupRequired: result.setupRequired,
    expiresAt: result.expiresAt.toISOString(),
  })
}

export async function requireCsrfHeader(request: Request): Promise<void> {
  await verifyCsrfForCurrentSession(request.headers.get('x-csrf-token'))
}
