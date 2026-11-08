import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { prepareMfaSetup } from '@/modules/auth'
import { mfaChallengeSchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const { challengeToken } = await parseJson(request, mfaChallengeSchema)
    const setup = await prepareMfaSetup(challengeToken, requestContext(request))
    return json({
      secret: setup.secret,
      otpauthUrl: setup.otpauthUrl,
      recoveryCodes: setup.recoveryCodes,
      expiresAt: setup.expiresAt.toISOString(),
    })
  })
}
