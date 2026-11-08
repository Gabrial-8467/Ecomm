import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, requestContext } from '@/lib/http'
import { deleteProductImage } from '@/modules/catalog'

type RouteContext = { params: Promise<{ productId: string; imageId: string }> }

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:delete')
    await requireCsrfHeader(request)
    const { imageId } = await context.params
    await deleteProductImage(imageId, actor.userId, requestContext(request))
    return json({ deleted: true })
  })
}
