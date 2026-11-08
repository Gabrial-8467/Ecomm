import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, requestContext } from '@/lib/http'
import { adminProductView, archiveProduct } from '@/modules/catalog'

type RouteContext = { params: Promise<{ productId: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:publish')
    await requireCsrfHeader(request)
    const { productId } = await context.params
    const product = await archiveProduct(productId, actor.userId, requestContext(request))
    return json({ product: adminProductView(product) })
  })
}
