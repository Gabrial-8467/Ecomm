import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import {
  categoryUpdateSchema,
  deleteCategory,
  getCategoryDetail,
  updateCategory,
} from '@/modules/catalog'

type RouteContext = { params: Promise<{ categoryId: string }> }

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    await requirePermissionActor('catalog:read')
    const { categoryId } = await context.params
    const category = await getCategoryDetail(categoryId)
    return json({ category })
  })
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { categoryId } = await context.params
    const input = await parseJson(request, categoryUpdateSchema)
    const category = await updateCategory(categoryId, input, actor.userId, requestContext(request))
    return json({ category })
  })
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:delete')
    await requireCsrfHeader(request)
    const { categoryId } = await context.params
    await deleteCategory(categoryId, actor.userId, requestContext(request))
    return json({ deleted: true })
  })
}
