import { requireCurrentActor } from '@/lib/auth/guards'
import { requireCsrfHeader } from '@/lib/auth/route-helpers'
import { handleApi, json, parseJson } from '@/lib/http'
import { getAccountProfile, updateProfile } from '@/modules/auth'
import { publicActor } from '@/modules/auth/auth.presenter'
import { profileUpdateSchema } from '@/modules/auth/auth.schema'

export async function GET(): Promise<Response> {
  return handleApi(async () => {
    const actor = await requireCurrentActor()
    const profile = await getAccountProfile(actor)
    return json({ actor: publicActor(actor), profile })
  })
}

export async function PATCH(request: Request): Promise<Response> {
  return handleApi(async () => {
    const actor = await requireCurrentActor()
    await requireCsrfHeader(request)
    const input = await parseJson(request, profileUpdateSchema)
    await updateProfile(actor, input)
    const profile = await getAccountProfile(actor)
    return json({ profile })
  })
}
