import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { brandInputSchema, createBrand, getBrands } from '@/modules/catalog'

export async function GET(): Promise<Response> {
  return handleApi(async () => {
    await requirePermissionActor('catalog:read')
    const brands = await getBrands({ includeInactive: true })
    return json({ brands })
  })
}

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const input = await parseJson(request, brandInputSchema)
    const brand = await createBrand(input, actor.userId, requestContext(request))
    return json({ brand }, { status: 201 })
  })
}
