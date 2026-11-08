import Decimal from 'decimal.js'

/**
 * Money and GST maths for Indian tax-inclusive pricing.
 *
 * All monetary values are stored as DECIMAL(14,2). Intermediate calculations
 * use Decimal.js (never IEEE-754 floats) and round half-up at the paisa.
 */

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export type MoneyInput = Decimal.Value

export const ZERO = new Decimal(0)

export function toDecimal(value: MoneyInput): Decimal {
  return new Decimal(value)
}

export function roundMoney(value: MoneyInput): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

export function sumMoney(values: MoneyInput[]): Decimal {
  return roundMoney(values.reduce<Decimal>((total, value) => total.plus(value), ZERO))
}

export function formatINR(
  value: MoneyInput,
  options: { locale?: string; withSymbol?: boolean; maximumFractionDigits?: number } = {},
): string {
  const amount = toDecimal(value).toNumber()
  return new Intl.NumberFormat(options.locale ?? 'en-IN', {
    style: 'currency',
    currency: 'INR',
    currencyDisplay: options.withSymbol === false ? 'code' : 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(amount)
}

/** Format without the currency symbol, e.g. for invoice tables. */
export function formatAmount(value: MoneyInput): string {
  return toDecimal(value).toFixed(2)
}

export interface GstBreakdown {
  /** Tax-inclusive amount the customer pays for the line. */
  gross: Decimal
  /** Value on which GST is charged. */
  taxableValue: Decimal
  /** Total tax contained in the gross amount. */
  taxAmount: Decimal
  cgst: Decimal
  sgst: Decimal
  igst: Decimal
  /** GST rate as a percentage, e.g. 18. */
  rate: Decimal
  isInterState: boolean
}

function normaliseRate(rate: MoneyInput): Decimal {
  const value = new Decimal(rate)
  if (value.isNegative() || value.greaterThan(100)) {
    throw new RangeError(`Invalid GST rate: ${value.toString()}`)
  }
  return value
}

/**
 * Extract GST from a tax-inclusive gross amount.
 *
 * Intra-state supply splits the tax equally between CGST and SGST; the last
 * paisa is assigned to SGST so that cgst + sgst === taxAmount exactly.
 */
export function gstFromInclusive(
  gross: MoneyInput,
  rate: MoneyInput,
  isInterState: boolean,
): GstBreakdown {
  const grossRounded = roundMoney(gross)
  const rateDecimal = normaliseRate(rate)

  if (grossRounded.isNegative()) {
    throw new RangeError('Gross amount cannot be negative')
  }

  if (rateDecimal.isZero()) {
    return {
      gross: grossRounded,
      taxableValue: grossRounded,
      taxAmount: ZERO,
      cgst: ZERO,
      sgst: ZERO,
      igst: ZERO,
      rate: rateDecimal,
      isInterState,
    }
  }

  const taxableValue = grossRounded.dividedBy(rateDecimal.dividedBy(100).plus(1)).toDecimalPlaces(2)
  const taxAmount = grossRounded.minus(taxableValue)

  if (isInterState) {
    return {
      gross: grossRounded,
      taxableValue,
      taxAmount,
      cgst: ZERO,
      sgst: ZERO,
      igst: taxAmount,
      rate: rateDecimal,
      isInterState,
    }
  }

  const cgst = taxAmount.dividedBy(2).toDecimalPlaces(2)
  const sgst = taxAmount.minus(cgst)

  return {
    gross: grossRounded,
    taxableValue,
    taxAmount,
    cgst,
    sgst,
    igst: ZERO,
    rate: rateDecimal,
    isInterState,
  }
}

/** Compute GST on a tax-exclusive net price. */
export function gstFromExclusive(
  taxableValue: MoneyInput,
  rate: MoneyInput,
  isInterState: boolean,
): GstBreakdown {
  const taxable = roundMoney(taxableValue)
  const rateDecimal = normaliseRate(rate)

  if (taxable.isNegative()) {
    throw new RangeError('Taxable value cannot be negative')
  }

  const taxAmount = roundMoney(taxable.times(rateDecimal).dividedBy(100))
  const gross = taxable.plus(taxAmount)

  if (isInterState) {
    return {
      gross,
      taxableValue: taxable,
      taxAmount,
      cgst: ZERO,
      sgst: ZERO,
      igst: taxAmount,
      rate: rateDecimal,
      isInterState,
    }
  }

  const cgst = taxAmount.dividedBy(2).toDecimalPlaces(2)
  const sgst = taxAmount.minus(cgst)

  return {
    gross,
    taxableValue: taxable,
    taxAmount,
    cgst,
    sgst,
    igst: ZERO,
    rate: rateDecimal,
    isInterState,
  }
}

/**
 * Sum line breakdowns into an order-level breakdown. This preserves the
 * invariant that the sum of line taxes equals the invoice tax total.
 */
export function combineGst(lines: GstBreakdown[]): Omit<GstBreakdown, 'rate'> {
  return {
    gross: sumMoney(lines.map((line) => line.gross)),
    taxableValue: sumMoney(lines.map((line) => line.taxableValue)),
    taxAmount: sumMoney(lines.map((line) => line.taxAmount)),
    cgst: sumMoney(lines.map((line) => line.cgst)),
    sgst: sumMoney(lines.map((line) => line.sgst)),
    igst: sumMoney(lines.map((line) => line.igst)),
    isInterState: lines.some((line) => line.isInterState),
  }
}

/** GST slabs used by the catalogue after the 2025 rate rationalisation. */
export const GST_RATES = {
  EXEMPT: 0,
  ESSENTIAL: 5,
  STANDARD: 18,
  LUXURY: 40,
} as const

export type GstRate = (typeof GST_RATES)[keyof typeof GST_RATES]
