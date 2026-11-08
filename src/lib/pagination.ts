import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 24
export const MAX_PAGE_SIZE = 100

export interface PageRequest {
  limit: number
  cursor?: string
}

export interface OffsetPageRequest {
  page: number
  limit: number
}

export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
  limit: number
}

export interface OffsetPage<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

const cursorPaginationSchema = z.object({
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

const offsetPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

type SearchParamsLike = URLSearchParams | Record<string, string | string[] | undefined>

function readParam(params: SearchParamsLike, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

export function parseCursorPagination(params: SearchParamsLike): PageRequest {
  return cursorPaginationSchema.parse({
    cursor: readParam(params, 'cursor'),
    limit: readParam(params, 'limit') ?? undefined,
  })
}

export function parseOffsetPagination(params: SearchParamsLike): OffsetPageRequest {
  return offsetPaginationSchema.parse({
    page: readParam(params, 'page') ?? undefined,
    limit: readParam(params, 'limit') ?? undefined,
  })
}

/**
 * Build a Prisma-compatible cursor clause. The id must be sortable by the
 * same ordering used for the query; callers should order by `[createdAt desc, id desc]`
 * or by id alone.
 */
export function cursorClause(cursor?: string): { cursor: { id: string }; skip: 1 } | undefined {
  return cursor ? { cursor: { id: cursor }, skip: 1 } : undefined
}

export function toCursorPage<T extends { id: string }>(rows: T[], limit: number): CursorPage<T> {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  return {
    items,
    limit,
    nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
  }
}

export function offsetToSkip(request: OffsetPageRequest): number {
  return (request.page - 1) * request.limit
}

export function toOffsetPage<T>(
  items: T[],
  total: number,
  request: OffsetPageRequest,
): OffsetPage<T> {
  return {
    items,
    page: request.page,
    limit: request.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / request.limit)),
  }
}
