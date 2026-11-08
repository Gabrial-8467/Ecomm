import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { brandUpdateSchema, deleteBrand, getBrand, updateBrand } from '@/modules/catalog'

type RouteContext = { params: Promise<{ brandId: string }> }

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    await requirePermissionActor('catalog:read')
    const { brandId } = await context.params
    const brand = await getBrand(brandId)
    return json({ brand })
  })
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { brandId } = await context.params
    const input = await parseJson(request, brandUpdateSchema)
    const brand = await updateBrand(brandId, input, actor.userId, requestContext(request))
    return json({ brand })
  })
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:delete')
    await requireCsrfHeader(request)
    const { brandId } = await context.params
    await deleteBrand(brandId, actor.userId, requestContext(request))
    return json({ deleted: true })
  })
}
