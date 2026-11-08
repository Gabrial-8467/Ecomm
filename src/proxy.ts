import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge of the application:
 * - per-request nonce + strict CSP
 * - hardened response headers
 * - request id for log correlation
 * - origin check for unsafe methods (defence in depth; CSRF tokens are still
 *   verified in server actions and route handlers)
 */

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function trustedOrigins(request: NextRequest): Set<string> {
  const configured = (process.env.TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return new Set([request.nextUrl.origin, ...configured])
}

function isSameOriginOrTrusted(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) {
    // Non-browser clients (webhooks, curl) usually omit Origin. Block only
    // requests the browser explicitly marks as cross-site.
    return request.headers.get('sec-fetch-site') !== 'cross-site'
  }
  return trustedOrigins(request).has(origin)
}

export default function proxy(request: NextRequest) {
  if (
    UNSAFE_METHODS.has(request.method) &&
    !request.nextUrl.pathname.startsWith('/api/v1/webhooks/') &&
    !isSameOriginOrTrusted(request)
  ) {
    return new NextResponse('Cross-origin request rejected', { status: 403 })
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isProduction = process.env.NODE_ENV === 'production'

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:${isProduction ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self' https:",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ')

  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-request-id', requestId)
  // Next.js reads this header to attach the nonce to its own script tags.
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-request-id', requestId)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com"), usb=(), interest-cohort=()',
  )
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  if (isProduction && !isLoopbackAppUrl()) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    )
  }

  return response
}

function isLoopbackAppUrl(): boolean {
  try {
    const url = new URL(process.env.APP_URL ?? '')
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|css|js|map|woff|woff2|ttf|otf)$).*)',
  ],
}
