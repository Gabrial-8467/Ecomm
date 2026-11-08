import { handleApi, json } from '@/lib/http'
import { getBrands } from '@/modules/catalog'

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600'

export async function GET(request: Request): Promise<Response> {
  return handleApi(async () => {
    const url = new URL(request.url)
    const featuredOnly = ['true', '1'].includes(url.searchParams.get('featured') ?? '')
    const brands = await getBrands({ featuredOnly })
    return json({ brands }, { headers: { 'Cache-Control': CACHE } })
  })
}
