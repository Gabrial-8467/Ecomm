import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, requestContext } from '@/lib/http'
import { deleteSpecification } from '@/modules/catalog'

type RouteContext = { params: Promise<{ productId: string; specificationId: string }> }

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:delete')
    await requireCsrfHeader(request)
    const { specificationId } = await context.params
    await deleteSpecification(specificationId, actor.userId, requestContext(request))
    return json({ deleted: true })
  })
}
