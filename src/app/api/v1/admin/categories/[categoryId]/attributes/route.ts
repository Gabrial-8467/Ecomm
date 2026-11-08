import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import {
  categoryAttributeAssignmentSchema,
  setCategoryAttributes,
} from '@/modules/catalog'

type RouteContext = { params: Promise<{ categoryId: string }> }

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { categoryId } = await context.params
    const input = await parseJson(request, categoryAttributeAssignmentSchema)
    const category = await setCategoryAttributes(
      categoryId,
      input.attributes,
      actor.userId,
      requestContext(request),
    )
    return json({ category })
  })
}
