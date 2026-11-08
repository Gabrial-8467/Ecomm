import { setAuthCookies } from '@/lib/auth/cookies'
import { requireCurrentSession } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { changePassword } from '@/modules/auth'
import { changePasswordSchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const session = await requireCurrentSession()
    await requireCsrfHeader(request)
    const input = await parseJson(request, changePasswordSchema)
    const next = await changePassword(
      session,
      input.currentPassword,
      input.newPassword,
      requestContext(request),
    )
    await setAuthCookies({
      kind: next.kind,
      token: next.token,
      csrfToken: next.csrfToken,
      maxAgeSeconds: next.maxAgeSeconds,
    })
    return json({ message: 'Password changed. Other sessions have been signed out.' })
  })
}
