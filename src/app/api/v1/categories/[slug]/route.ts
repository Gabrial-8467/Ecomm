import { NotFoundError } from '@/lib/errors'
import { handleApi, json } from '@/lib/http'
import { getCategoryPage, parsePublicCatalogQuery } from '@/modules/catalog'

type RouteContext = { params: Promise<{ slug: string }> }

const CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return handleApi(async () => {
    const { slug } = await context.params
    const url = new URL(request.url)
    const query = parsePublicCatalogQuery(url.searchParams)
    const page = await getCategoryPage(slug, query)
    if (!page) throw new NotFoundError('Category not found.')
    return json(
      {
        category: page.category,
        breadcrumb: page.breadcrumb,
        items: page.items,
        facets: page.facets,
        pagination: {
          page: page.page,
          limit: page.limit,
          total: page.total,
          totalPages: page.totalPages,
        },
      },
      { headers: { 'Cache-Control': CACHE } },
    )
  })
}
