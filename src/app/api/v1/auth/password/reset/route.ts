import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { resetPassword } from '@/modules/auth'
import { passwordResetSchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const input = await parseJson(request, passwordResetSchema)
    await resetPassword(input.token, input.password, requestContext(request))
    return json({ message: 'Password updated. All other sessions have been signed out.' })
  })
}
