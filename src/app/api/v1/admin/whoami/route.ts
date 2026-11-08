import { requirePermissionActor } from '@/lib/auth/guards'
import { handleApi, json } from '@/lib/http'
import { publicActor } from '@/modules/auth/auth.presenter'

export async function GET(): Promise<Response> {
  return handleApi(async () => {
    const actor = await requirePermissionActor('dashboard:read')
    return json({ actor: publicActor(actor) })
  })
}
