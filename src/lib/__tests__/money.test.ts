import { describe, expect, it } from 'vitest'

import {
  GST_RATES,
  combineGst,
  formatINR,
  gstFromExclusive,
  gstFromInclusive,
  roundMoney,
  sumMoney,
} from '@/lib/money'

describe('money rounding', () => {
  it('rounds half-up at the paisa', () => {
    expect(roundMoney('10.005').toString()).toBe('10.01')
    expect(roundMoney('10.004').toString()).toBe('10')
    expect(roundMoney('-0.005').toString()).toBe('-0.01')
  })

  it('sums without floating point drift', () => {
    expect(sumMoney(['0.1', '0.2']).toString()).toBe('0.3')
  })

  it('formats INR using Indian digit grouping', () => {
    expect(formatINR(125000).replace(/\u00a0/g, ' ')).toContain('1,25,000.00')
  })
})

describe('gstFromInclusive', () => {
  it('extracts 18% GST intra-state and splits CGST/SGST exactly', () => {
    const result = gstFromInclusive(1180, GST_RATES.STANDARD, false)
    expect(result.taxableValue.toString()).toBe('1000')
    expect(result.taxAmount.toString()).toBe('180')
    expect(result.cgst.toString()).toBe('90')
    expect(result.sgst.toString()).toBe('90')
    expect(result.igst.toString()).toBe('0')
    expect(result.cgst.plus(result.sgst).equals(result.taxAmount)).toBe(true)
  })

  it('assigns the rounding remainder to SGST', () => {
    const result = gstFromInclusive(999, 18, false)
    expect(result.cgst.plus(result.sgst).equals(result.taxAmount)).toBe(true)
    expect(result.cgst.plus(result.sgst).plus(result.taxableValue).equals(result.gross)).toBe(true)
  })

  it('uses IGST for inter-state supply', () => {
    const result = gstFromInclusive(1180, 18, true)
    expect(result.cgst.toString()).toBe('0')
    expect(result.sgst.toString()).toBe('0')
    expect(result.igst.toString()).toBe('180')
  })

  it('handles zero-rated goods', () => {
    const result = gstFromInclusive(500, 0, false)
    expect(result.taxableValue.toString()).toBe('500')
    expect(result.taxAmount.toString()).toBe('0')
  })

  it('rejects impossible rates and negative gross amounts', () => {
    expect(() => gstFromInclusive(100, -1, false)).toThrow(RangeError)
    expect(() => gstFromInclusive(100, 101, false)).toThrow(RangeError)
    expect(() => gstFromInclusive(-1, 18, false)).toThrow(RangeError)
  })
})

describe('gstFromExclusive', () => {
  it('adds tax to a net price', () => {
    const result = gstFromExclusive(1000, 18, false)
    expect(result.taxAmount.toString()).toBe('180')
    expect(result.gross.toString()).toBe('1180')
  })
})

describe('combineGst', () => {
  it('sums line tax components into the invoice total', () => {
    const lines = [gstFromInclusive(1180, 18, false), gstFromInclusive(590, 18, false)]
    const total = combineGst(lines)
    expect(total.taxableValue.toString()).toBe('1500')
    expect(total.taxAmount.toString()).toBe('270')
    expect(total.cgst.plus(total.sgst).equals(total.taxAmount)).toBe(true)
    expect(total.gross.toString()).toBe('1770')
    expect(total.isInterState).toBe(false)
  })
})
