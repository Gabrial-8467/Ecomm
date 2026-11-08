import { handleApi, json } from '@/lib/http'
import { getSearchProvider } from '@/modules/catalog'

const CACHE = 'public, s-maxage=30, stale-while-revalidate=120'

export async function GET(request: Request): Promise<Response> {
  return handleApi(async () => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120)
    const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit') ?? 10) || 10))
    const result = await getSearchProvider().suggest(q, limit)
    return json(result, {
      headers: { 'Cache-Control': q.length < 2 ? 'no-store' : CACHE },
    })
  })
}
