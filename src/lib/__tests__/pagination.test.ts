import { describe, expect, it } from 'vitest'

import {
  cursorClause,
  offsetToSkip,
  parseCursorPagination,
  parseOffsetPagination,
  toCursorPage,
  toOffsetPage,
} from '@/lib/pagination'

describe('pagination parsing', () => {
  it('applies defaults and clamps the maximum', () => {
    expect(parseOffsetPagination({})).toEqual({ page: 1, limit: 24 })
    expect(() => parseOffsetPagination({ limit: '101' })).toThrow()
    expect(parseOffsetPagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10 })
  })

  it('reads URLSearchParams as well as records', () => {
    expect(parseCursorPagination(new URLSearchParams('limit=5&cursor=abc'))).toEqual({
      limit: 5,
      cursor: 'abc',
    })
  })

  it('builds cursor and offset clauses', () => {
    expect(cursorClause('abc')).toEqual({ cursor: { id: 'abc' }, skip: 1 })
    expect(cursorClause(undefined)).toBeUndefined()
    expect(offsetToSkip({ page: 4, limit: 20 })).toBe(60)
  })

  it('detects a next cursor without leaking the extra row', () => {
    const rows = [{ id: '1' }, { id: '2' }, { id: '3' }]
    expect(toCursorPage(rows, 2)).toEqual({
      items: [{ id: '1' }, { id: '2' }],
      limit: 2,
      nextCursor: '2',
    })
    expect(toCursorPage(rows, 5).nextCursor).toBeNull()
  })

  it('computes offset page metadata', () => {
    expect(toOffsetPage(['a'], 41, { page: 3, limit: 20 })).toEqual({
      items: ['a'],
      page: 3,
      limit: 20,
      total: 41,
      totalPages: 3,
    })
  })
})
