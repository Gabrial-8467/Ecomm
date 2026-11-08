import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { addVariant, variantInputSchema } from '@/modules/catalog'

type RouteContext = { params: Promise<{ productId: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { productId } = await context.params
    const input = await parseJson(request, variantInputSchema)
    const variant = await addVariant(productId, input, actor.userId, requestContext(request))
    return json({ variant }, { status: 201 })
  })
}
