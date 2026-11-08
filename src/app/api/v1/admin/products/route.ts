import { requirePermissionActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import {
  adminProductView,
  createProduct,
  listAdminProducts,
  productInputSchema,
  productListQuerySchema,
} from '@/modules/catalog'

export async function GET(request: Request): Promise<Response> {
  return handleApi(async () => {
    await requirePermissionActor('catalog:read')
    const url = new URL(request.url)
    const query = productListQuerySchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      categoryId: url.searchParams.get('categoryId') ?? undefined,
      brandId: url.searchParams.get('brandId') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    })
    const result = await listAdminProducts(query)
    return json(result)
  })
}

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('catalog:write')
    await requireCsrfHeader(request)
    const input = await parseJson(request, productInputSchema)
    const product = await createProduct(input, actor.userId, requestContext(request))
    return json({ product: adminProductView(product) }, { status: 201 })
  })
}
