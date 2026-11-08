import 'server-only'

import { ZodError, type ZodType } from 'zod'

import { isAppError, RateLimitError, ValidationError, fromZodError } from '@/lib/errors'

const MAX_JSON_BYTES = 1_000_000

export interface RequestContext {
  ip: string | null
  userAgent: string | null
  requestId: string | null
}

export function requestContext(request: Request): RequestContext {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
  return {
    ip,
    userAgent: request.headers.get('user-agent'),
    requestId: request.headers.get('x-request-id'),
  }
}

export function json(
  data: unknown,
  init: { status?: number; headers?: HeadersInit } = {},
): Response {
  return Response.json(data, {
    status: init.status ?? 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
      ...init.headers,
    },
  })
}

export function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > MAX_JSON_BYTES) {
    throw new ValidationError('Request body is too large.')
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    throw new ValidationError('Request body must be valid JSON.')
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) throw fromZodError(parsed.error)
  return parsed.data
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    const mapped = fromZodError(error)
    return json(
      { code: mapped.code, message: mapped.message, details: mapped.details },
      { status: mapped.status },
    )
  }

  if (isAppError(error)) {
    const headers: Record<string, string> = {}
    if (error instanceof RateLimitError) {
      const retryAfter = (error.details as { retryAfterSeconds?: number } | undefined)
        ?.retryAfterSeconds
      if (retryAfter) headers['Retry-After'] = String(retryAfter)
    }
    return json(
      {
        code: error.code,
        message: error.expose ? error.message : 'Something went wrong. Please try again.',
        ...(error.expose && error.details !== undefined ? { details: error.details } : {}),
      },
      { status: error.status, headers },
    )
  }

  return json(
    { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
    { status: 500 },
  )
}

/** Wrap a route handler so thrown application errors map to the API envelope. */
export async function handleApi(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler()
  } catch (error) {
    return errorResponse(error)
  }
}
