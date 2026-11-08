import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { createCategory, getCategoryTree, categoryInputSchema } from '@/modules/catalog'

export async function GET(): Promise<Response> {
  return handleApi(async () => {
    await requirePermissionActor('catalog:read')
    const tree = await getCategoryTree()
    return json({ tree })
  })
}

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const input = await parseJson(request, categoryInputSchema)
    const category = await createCategory(input, actor.userId, requestContext(request))
    return json({ category }, { status: 201 })
  })
}
