import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { requestPasswordReset } from '@/modules/auth'
import { emailOnlySchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const { email } = await parseJson(request, emailOnlySchema)
    await requestPasswordReset(email, requestContext(request))
    return json(
      { message: 'If an account exists for that address, a reset link has been sent.' },
      { status: 202 },
    )
  })
}
