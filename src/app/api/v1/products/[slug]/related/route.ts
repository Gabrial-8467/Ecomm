import { handleApi, json } from '@/lib/http'
import { getRelatedProducts } from '@/modules/catalog'

type RouteContext = { params: Promise<{ slug: string }> }

const CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const { slug } = await context.params
    const items = await getRelatedProducts(slug, 8)
    return json({ items }, { headers: { 'Cache-Control': CACHE } })
  })
}
