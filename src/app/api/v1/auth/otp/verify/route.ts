import { respondToLogin } from '@/lib/auth/route-helpers'
import { handleApi, parseJson, requestContext } from '@/lib/http'
import { verifyPhoneOtp } from '@/modules/auth'
import { otpVerifySchema } from '@/modules/auth/auth.schema'

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    const input = await parseJson(request, otpVerifySchema)
    const result = await verifyPhoneOtp(input, requestContext(request))
    return respondToLogin(result)
  })
}
