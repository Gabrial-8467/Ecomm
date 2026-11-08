import { describe, expect, it } from 'vitest'

import { generateVariantCombinations, matrixSkuSuffix } from '@/modules/catalog/matrix'

const colour = {
  code: 'color',
  name: 'Colour',
  options: [
    { id: 'black', value: 'Black', label: 'Black' },
    { id: 'beige', value: 'Beige', label: 'Beige' },
  ],
}

const size = {
  code: 'size',
  name: 'Size',
  options: [
    { id: 'two', value: '2 Seat', label: '2-seat' },
    { id: 'three', value: '3 Seat', label: '3-seat' },
    { id: 'four', value: '4 Seat', label: '4-seat' },
  ],
}

describe('generateVariantCombinations', () => {
  it('produces a deterministic cartesian product with stable keys and labels', () => {
    const combinations = generateVariantCombinations([colour, size])

    expect(combinations).toHaveLength(6)
    expect(combinations[0]!.key).toBe('color:black|size:two')
    expect(combinations[0]!.labels).toEqual(['Black', '2-seat'])
    expect(combinations[0]!.options.map((option) => option.value)).toEqual(['Black', '2 Seat'])
    expect(combinations[5]!.key).toBe('color:beige|size:four')
  })

  it('ignores axes without options and returns no combinations when nothing is usable', () => {
    expect(
      generateVariantCombinations([colour, { code: 'finish', name: 'Finish', options: [] }]),
    ).toHaveLength(2)
    expect(generateVariantCombinations([])).toEqual([])
    expect(generateVariantCombinations([{ code: 'finish', name: 'Finish', options: [] }])).toEqual(
      [],
    )
  })
})

describe('matrixSkuSuffix', () => {
  it('builds an uppercase, sanitised suffix', () => {
    const combination = generateVariantCombinations([colour, size])[0]!
    expect(matrixSkuSuffix(combination)).toBe('BLACK-2-SEAT')
  })

  it('truncates long suffixes without trailing separators', () => {
    const long = generateVariantCombinations([
      {
        code: 'code',
        name: 'Code',
        options: [
          {
            id: 'long',
            value: 'A very long option value that should be truncated safely',
            label: 'Long',
          },
        ],
      },
    ])[0]!
    const suffix = matrixSkuSuffix(long)
    expect(suffix.length).toBeLessThanOrEqual(48)
    expect(suffix.startsWith('A-VERY-LONG')).toBe(true)
    expect(suffix.endsWith('-')).toBe(false)
  })
})
