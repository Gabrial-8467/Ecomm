import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { verifyEmail } from '@/modules/auth'
import { tokenSchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const { token } = await parseJson(request, tokenSchema)
    await verifyEmail(token, requestContext(request))
    return json({ message: 'Email verified. You can now sign in.' })
  })
}
