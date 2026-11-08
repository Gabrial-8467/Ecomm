import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { attributeInputSchema, createAttribute, getAttributes } from '@/modules/catalog'

export async function GET(): Promise<Response> {
  return handleApi(async () => {
    await requirePermissionActor('catalog:read')
    const attributes = await getAttributes({ includeInactive: true })
    return json({ attributes })
  })
}

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const input = await parseJson(request, attributeInputSchema)
    const attribute = await createAttribute(input, actor.userId, requestContext(request))
    return json({ attribute }, { status: 201 })
  })
}
