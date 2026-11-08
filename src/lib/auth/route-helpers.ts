import 'server-only'

import { setAuthCookies } from '@/lib/auth/cookies'
import { verifyCsrfForCurrentSession } from '@/lib/auth/guards'
import { json } from '@/lib/http'
import { publicActor } from '@/modules/auth/auth.presenter'
import type { LoginResult } from '@/modules/auth/auth.service'

export async function respondToLogin(result: LoginResult): Promise<Response> {
  if (result.status === 'authenticated') {
    await setAuthCookies({
      kind: result.session.kind,
      token: result.session.token,
      csrfToken: result.session.csrfToken,
      maxAgeSeconds: result.session.maxAgeSeconds,
    })
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
