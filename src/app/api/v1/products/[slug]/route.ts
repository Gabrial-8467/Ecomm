import { NotFoundError } from '@/lib/errors'
import { handleApi, json } from '@/lib/http'
import {
  catalogEtag,
  findPublishedProductBySlug,
  getCatalogVersion,
  productDetailView,
} from '@/modules/catalog'

type RouteContext = { params: Promise<{ slug: string }> }

const CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const { slug } = await context.params
    const product = await findPublishedProductBySlug(slug)
    if (!product) throw new NotFoundError('Product not found.')

    const version = await getCatalogVersion()
    const etag = catalogEtag(version, product.updatedAt)
    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': CACHE } })
    }

    return json(
      { product: productDetailView(product) },
      { headers: { 'Cache-Control': CACHE, ETag: etag } },
    )
  })
}
