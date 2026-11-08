import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, requestContext } from '@/lib/http'
import { removeProductAttribute } from '@/modules/catalog'

type RouteContext = { params: Promise<{ productId: string; attributeId: string }> }

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { productId, attributeId } = await context.params
    await removeProductAttribute(productId, attributeId, actor.userId, requestContext(request))
    return json({ deleted: true })
  })
}
