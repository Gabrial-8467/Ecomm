import 'server-only'

import Decimal from 'decimal.js'

import type { Invoice, Order, Prisma } from '@/generated/prisma/client'
import { NotFoundError } from '@/lib/errors'
import { combineGst, gstFromInclusive, roundMoney } from '@/lib/money'
import { prisma } from '@/lib/prisma'

/**
 * GST invoices. Invoice numbers are allocated from a per-financial-year
 * sequence inside the same transaction as the order confirmation, so a number
 * is never reused or skipped by a rolled-back attempt.
 */

export type Tx = Prisma.TransactionClient

/** Indian financial year label for a date, e.g. 2025-26 for May 2025. */
export function financialYearFor(date: Date): string {
  const year = date.getUTCFullYear()
  const start = date.getUTCMonth() + 1 >= 4 ? year : year - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

/**
 * Allocate the next serial for a financial year. `upsert` is a single SQL
 * statement, so concurrent confirmations cannot read the same counter value.
 */
async function nextInvoiceNumber(tx: Tx, financialYear: string): Promise<string> {
  const row = await tx.invoiceSequence.upsert({
    where: {
      financialYear_documentType: { financialYear, documentType: 'INVOICE' },
    },
    create: { financialYear, documentType: 'INVOICE', nextNumber: 2 },
    update: { nextNumber: { increment: 1 } },
  })
  const serial = row.nextNumber - 1
  return `CC/${financialYear}/${String(serial).padStart(6, '0')}`
}

export interface InvoiceTotals {
  taxableValue: Decimal
  cgst: Decimal
  sgst: Decimal
  igst: Decimal
  total: Decimal
}

/**
 * Goods totals come from the immutable order-item snapshot. Delivery and COD
 * charges are treated as tax-inclusive service charges at 18%, which is the
 * standard slab for such services; the invoice shows the extracted tax rather
 * than inventing a separate line.
 */
export function invoiceTotals(
  order: Pick<Order, 'grandTotal' | 'shippingTotal' | 'codFee' | 'isInterState'>,
  items: { taxableValue: Prisma.Decimal; cgst: Prisma.Decimal; sgst: Prisma.Decimal; igst: Prisma.Decimal }[],
): InvoiceTotals {
  const goods = combineGst(
    items.map((item) => ({
      gross: new Decimal(item.taxableValue.toString())
        .plus(new Decimal(item.cgst.toString()))
        .plus(new Decimal(item.sgst.toString()))
        .plus(new Decimal(item.igst.toString())),
      taxableValue: new Decimal(item.taxableValue.toString()),
      taxAmount: new Decimal(item.cgst.toString())
        .plus(new Decimal(item.sgst.toString()))
        .plus(new Decimal(item.igst.toString())),
      cgst: new Decimal(item.cgst.toString()),
      sgst: new Decimal(item.sgst.toString()),
      igst: new Decimal(item.igst.toString()),
      rate: new Decimal(0),
      isInterState: order.isInterState,
    })),
  )

  const serviceGross = new Decimal(order.shippingTotal.toString()).plus(
    new Decimal(order.codFee.toString()),
  )
  const service =
    serviceGross.isZero()
      ? null
      : gstFromInclusive(serviceGross, 18, order.isInterState)

  return {
    taxableValue: roundMoney(goods.taxableValue.plus(service?.taxableValue ?? 0)),
    cgst: roundMoney(goods.cgst.plus(service?.cgst ?? 0)),
    sgst: roundMoney(goods.sgst.plus(service?.sgst ?? 0)),
    igst: roundMoney(goods.igst.plus(service?.igst ?? 0)),
    total: roundMoney(order.grandTotal.toString()),
  }
}

/**
 * Create the invoice for a confirmed order. Titles for `sellerState` and
 * `placeOfSupply` are stored on the order snapshot at placement time.
 */
export async function issueInvoice(
  tx: Tx,
  input: {
    order: Order
    items: {
      taxableValue: Prisma.Decimal
      cgst: Prisma.Decimal
      sgst: Prisma.Decimal
      igst: Prisma.Decimal
    }[]
    sellerGstin: string | null
    placeOfSupply: string | null
  },
): Promise<Invoice> {
  const existing = await tx.invoice.findUnique({ where: { orderId: input.order.id } })
  if (existing) return existing

  const issuedAt = new Date()
  const financialYear = financialYearFor(issuedAt)
  const invoiceNumber = await nextInvoiceNumber(tx, financialYear)
  const totals = invoiceTotals(input.order, input.items)

  return tx.invoice.create({
    data: {
      orderId: input.order.id,
      invoiceNumber,
      financialYear,
      invoiceDate: issuedAt,
      placeOfSupply: input.placeOfSupply,
      sellerGstin: input.sellerGstin,
      taxableValue: totals.taxableValue.toFixed(2),
      cgst: totals.cgst.toFixed(2),
      sgst: totals.sgst.toFixed(2),
      igst: totals.igst.toFixed(2),
      roundOff: '0.00',
      total: totals.total.toFixed(2),
      status: 'ISSUED',
    },
  })
}

export async function getInvoiceByOrderNumber(orderNumber: string): Promise<{
  invoice: Invoice
  order: Order
} | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { invoice: true },
  })
  if (!order?.invoice) return null
  return { invoice: order.invoice, order }
}

export async function getInvoice(orderId: string): Promise<Invoice> {
  const invoice = await prisma.invoice.findUnique({ where: { orderId } })
  if (!invoice) throw new NotFoundError('No invoice has been issued for this order yet.')
  return invoice
}
