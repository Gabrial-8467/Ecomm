import { z } from 'zod'

import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { deleteVariant, updateVariant, variantUpdateSchema } from '@/modules/catalog'

type RouteContext = { params: Promise<{ variantId: string }> }

const updateSchema = variantUpdateSchema.extend({ reason: z.string().trim().max(240).optional() })

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const { variantId } = await context.params
    const { reason, ...input } = await parseJson(request, updateSchema)
    const variant = await updateVariant(
      variantId,
      input,
      actor.userId,
      reason,
      requestContext(request),
    )
    return json({ variant })
  })
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:delete')
    await requireCsrfHeader(request)
    const { variantId } = await context.params
    await deleteVariant(variantId, actor.userId, requestContext(request))
    return json({ deleted: true })
  })
}
