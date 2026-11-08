import { respondToLogin } from '@/lib/auth/route-helpers'
import { handleApi, parseJson, requestContext } from '@/lib/http'
import { enableMfa } from '@/modules/auth'
import { mfaVerifySchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const input = await parseJson(request, mfaVerifySchema)
    const result = await enableMfa(input.challengeToken, input.code, requestContext(request))
    return respondToLogin(result)
  })
}
