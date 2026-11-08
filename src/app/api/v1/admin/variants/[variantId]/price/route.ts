import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { changeVariantPrice, productPriceInputSchema } from '@/modules/catalog'

type RouteContext = { params: Promise<{ variantId: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { variantId } = await context.params
    const input = await parseJson(request, productPriceInputSchema)
    const variant = await changeVariantPrice(
      variantId,
      input,
      actor.userId,
      requestContext(request),
    )
    return json({ variant })
  })
}
