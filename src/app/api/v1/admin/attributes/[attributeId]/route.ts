import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import {
  attributeUpdateSchema,
  deleteAttribute,
  getAttribute,
  updateAttribute,
} from '@/modules/catalog'

type RouteContext = { params: Promise<{ attributeId: string }> }

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    await requirePermissionActor('catalog:read')
    const { attributeId } = await context.params
    const attribute = await getAttribute(attributeId)
    return json({ attribute })
  })
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { attributeId } = await context.params
    const input = await parseJson(request, attributeUpdateSchema)
    const attribute = await updateAttribute(
      attributeId,
      input,
      actor.userId,
      requestContext(request),
    )
    return json({ attribute })
  })
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:delete')
    await requireCsrfHeader(request)
    const { attributeId } = await context.params
    await deleteAttribute(attributeId, actor.userId, requestContext(request))
    return json({ deleted: true })
  })
}
