import { handleApi, json, parseJson, requestContext } from '@/lib/http'
import { requestPhoneOtp } from '@/modules/auth'
import { otpRequestSchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const input = await parseJson(request, otpRequestSchema)
    await requestPhoneOtp(input, requestContext(request))
    return json(
      { message: 'If the number can receive messages, a code has been sent.' },
      { status: 202 },
    )
  })
}
