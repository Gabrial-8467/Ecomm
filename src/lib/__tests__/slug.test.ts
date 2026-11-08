import { describe, expect, it } from 'vitest'

import { isReservedSlug, slugify, slugWithSuffix } from '@/lib/slug'

describe('slugify', () => {
  it('normalises case, spaces and punctuation', () => {
    expect(slugify('  Sofas & Seating ')).toBe('sofas-and-seating')
    expect(slugify('Queen-Size Bed (Walnut)')).toBe('queen-size-bed-walnut')
    expect(slugify('Café chair')).toBe('cafe-chair')
    expect(slugify('C++  /  C#')).toBe('c-c')
  })

  it('collapses repeated separators and trims edges', () => {
    expect(slugify('---hello---world---')).toBe('hello-world')
  })

  it('returns a fallback for empty input', () => {
    expect(slugify('', 'product')).toBe('product')
    expect(slugify('!!!', 'product')).toBe('product')
  })

  it('avoids reserved application routes', () => {
    expect(slugify('admin')).toBe('admin-1')
    expect(isReservedSlug('checkout')).toBe(true)
  })

  it('produces deterministic suffixes', () => {
    expect(slugWithSuffix('sofa', 0)).toBe('sofa')
    expect(slugWithSuffix('sofa', 1)).toBe('sofa-2')
  })

  it('caps long input', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(80)
  })
})
