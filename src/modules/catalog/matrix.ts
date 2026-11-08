export interface MatrixAxisOption {
  id: string
  value: string
  label: string
}

export interface MatrixAxis {
  code: string
  name: string
  options: MatrixAxisOption[]
}

export interface VariantCombination {
  key: string
  labels: string[]
  /** Ordered to match the axis list. */
  options: MatrixAxisOption[]
  axes: { code: string; name: string; option: MatrixAxisOption }[]
}

/**
 * Cartesian product of variant axes. Deterministic order keeps SKU and test
 * output stable. Duplicate option values across axes are allowed; `key`
 * combines axis code and option id so it remains unique.
 */
export function generateVariantCombinations(axes: MatrixAxis[]): VariantCombination[] {
  const usable = axes.filter((axis) => axis.options.length > 0)
  if (usable.length === 0) return []

  let combinations: MatrixAxisOption[][] = [[]]
  for (const axis of usable) {
    const next: MatrixAxisOption[][] = []
    for (const combination of combinations) {
      for (const option of axis.options) {
        next.push([...combination, option])
      }
    }
    combinations = next
  }

  return combinations.map((options) => {
    const axesWithOptions = usable.map((axis, index) => ({
      code: axis.code,
      name: axis.name,
      option: options[index]!,
    }))
    return {
      key: axesWithOptions
        .map((entry) => `${entry.code}:${entry.option.id}`)
        .sort()
        .join('|'),
      labels: axesWithOptions.map((entry) => entry.option.label),
      options,
      axes: axesWithOptions,
    }
  })
}

export function matrixSkuSuffix(combination: VariantCombination): string {
  return combination.axes
    .map((entry) => entry.option.value)
    .join('-')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}
