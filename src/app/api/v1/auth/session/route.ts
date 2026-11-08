import { readCsrfCookie } from '@/lib/auth/cookies'
import { getCurrentSession } from '@/lib/auth/guards'
import { UnauthenticatedError } from '@/lib/errors'
import { handleApi, json } from '@/lib/http'
import { publicActor } from '@/modules/auth/auth.presenter'

export async function GET(): Promise<Response> {
  return handleApi(async () => {
    const session = await getCurrentSession()
    if (!session) throw new UnauthenticatedError()

    return json({
      actor: publicActor(session.actor),
      csrfToken: await readCsrfCookie(session.kind),
      expiresAt: session.expiresAt.toISOString(),
    })
  })
}
