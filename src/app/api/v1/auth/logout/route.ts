import { clearAuthCookies } from '@/lib/auth/cookies'
import { requireCurrentSession } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, noContent, requestContext } from '@/lib/http'
import { logout } from '@/modules/auth'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const session = await requireCurrentSession()
    await requireCsrfHeader(request)
    await logout(session, requestContext(request))
    await clearAuthCookies()
    return noContent()
  })
}
