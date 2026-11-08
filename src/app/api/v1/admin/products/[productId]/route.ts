import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import {
  adminProductView,
  deleteProduct,
  getAdminProduct,
  productUpdateSchema,
  updateProduct,
} from '@/modules/catalog'

type RouteContext = { params: Promise<{ productId: string }> }

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    await requirePermissionActor('catalog:read')
    const { productId } = await context.params
    const result = await getAdminProduct(productId)
    return json(result)
  })
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { productId } = await context.params
    const input = await parseJson(request, productUpdateSchema)
    const product = await updateProduct(productId, input, actor.userId, requestContext(request))
    return json({ product: adminProductView(product) })
  })
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:delete')
    await requireCsrfHeader(request)
    const { productId } = await context.params
    await deleteProduct(productId, actor.userId, requestContext(request))
    return json({ deleted: true })
  })
}
