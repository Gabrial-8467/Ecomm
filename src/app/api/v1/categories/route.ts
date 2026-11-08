import { handleApi, json } from '@/lib/http'
import { getCategoryTree } from '@/modules/catalog'

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600'

export async function GET(): Promise<Response> {
  return handleApi(async () => {
    const tree = await getCategoryTree({ activeOnly: true })
    return json({ tree }, { headers: { 'Cache-Control': CACHE } })
  })
}
