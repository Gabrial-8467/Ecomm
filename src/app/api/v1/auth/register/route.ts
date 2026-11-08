import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { register } from '@/modules/auth'
import { registerSchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const input = await parseJson(request, registerSchema)
    await register(input, requestContext(request))
    return json(
      {
        message: 'Account created. Check your email for a verification link before signing in.',
      },
      { status: 201 },
    )
  })
}
