import { respondToLogin } from '@/lib/auth/route-helpers'
import { handleApi, parseJson, requestContext } from '@/lib/http'
import { login } from '@/modules/auth'
import { loginSchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const input = await parseJson(request, loginSchema)
    const result = await login(input, requestContext(request))
    return respondToLogin(result)
  })
}
