import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { resendVerification } from '@/modules/auth'
import { emailOnlySchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const { email } = await parseJson(request, emailOnlySchema)
    await resendVerification(email, requestContext(request))
    return json(
      { message: 'If that address needs verification, a new link has been sent.' },
      { status: 202 },
    )
  })
}
