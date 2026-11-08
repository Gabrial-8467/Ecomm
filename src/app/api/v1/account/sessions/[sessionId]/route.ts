import { requireCurrentActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, requestContext } from '@/lib/http'
import { revokeOwnSession } from '@/modules/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  return handleApi(async () => {
    const actor = await requireCurrentActor()
    await requireCsrfHeader(request)
    const { sessionId } = await params
    await revokeOwnSession(actor, sessionId, requestContext(request))
    return json({ message: 'Session revoked.' })
  })
}
