import { requireCurrentActor } from '@/lib/auth/guards'
import { handleApi, json } from '@/lib/http'
import { listSessionsForActor } from '@/modules/auth'

export async function GET(): Promise<Response> {
  return handleApi(async () => {
    const actor = await requireCurrentActor()
    const sessions = await listSessionsForActor(actor)
    return json({ sessions })
  })
}
