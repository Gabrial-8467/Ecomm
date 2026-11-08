import { handleApi, json } from '@/lib/http'
import { getSearchProvider, parsePublicCatalogQuery } from '@/modules/catalog'

const CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(request: Request): Promise<Response> {
  return handleApi(async () => {
    const url = new URL(request.url)
    const query = parsePublicCatalogQuery(url.searchParams)
    const result = await getSearchProvider().search(query)
    return json(
      {
        items: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        facets: result.facets,
        query,
      },
      { headers: { 'Cache-Control': CACHE } },
    )
  })
}
