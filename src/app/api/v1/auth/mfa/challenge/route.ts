import { handleApi, json, parseJson } from '@/lib/http'
import { getMfaChallengeInfo } from '@/modules/auth'
import { mfaChallengeSchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const { challengeToken } = await parseJson(request, mfaChallengeSchema)
    const info = await getMfaChallengeInfo(challengeToken)
    return json({
      setupRequired: info.setupRequired,
      expiresAt: info.expiresAt.toISOString(),
      email: info.email,
    })
  })
}
