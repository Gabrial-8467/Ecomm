import { describe, expect, it } from 'vitest'

import { formatPublishIssues, validateProductForPublish } from '@/modules/catalog/publish'
import type { ProductDetail } from '@/modules/catalog/catalog.repository'

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

function product(overrides: DeepPartial<ProductDetail> = {}): ProductDetail {
  const base = {
    name: 'Walnut sofa',
    slug: 'walnut-sofa',
    category: { isActive: true, archivedAt: null, returnWindowDays: 7 },
    variants: [
      {
        sku: 'SOFA-WAL-3',
        isActive: true,
        price: '45000.00',
        mrp: '52000.00',
      },
    ],
    images: [{ url: 'https://cdn.example.com/sofa.jpg', alt: 'Walnut sofa, three seats' }],
    hsnCode: '94036000',
    gstRate: '18.00',
    priceIncludesTax: true,
    countryOfOrigin: 'IN',
    manufacturerName: 'Example Furniture Works',
    manufacturerAddress: 'Plot 4, Industrial Area, Jaipur',
    packerName: 'Example Furniture Works',
    importerName: null,
    netQuantity: '1.000',
    unitOfMeasure: 'piece',
    unitSalePrice: '45000.00',
    consumerCareEmail: 'care@example.com',
    consumerCarePhone: null,
    warrantyType: 'MANUFACTURER',
    warrantyMonths: 12,
    isReturnable: true,
    returnWindowDays: 7,
    publishedAt: null,
    attributeValues: [],
    seller: {
      legalName: 'CasaCircuit Retail Private Limited',
      registeredAddress: {
        line1: '1 Test Street',
        city: 'Bengaluru',
        postalCode: '560001',
      },
      customerCareEmail: 'care@example.com',
      customerCarePhone: null,
    },
    ...overrides,
  }
  return base as unknown as ProductDetail
}

describe('validateProductForPublish', () => {
  it('passes a complete declaration set', () => {
    expect(validateProductForPublish(product())).toEqual([])
    expect(formatPublishIssues([])).toBe('Product is ready to publish.')
  })

  it('reports every missing Legal Metrology field and seller prerequisite', () => {
    const issues = validateProductForPublish(
      product({
        hsnCode: null,
        countryOfOrigin: '',
        manufacturerName: null,
        manufacturerAddress: null,
        packerName: null,
        netQuantity: null,
        unitOfMeasure: null,
        unitSalePrice: null,
        consumerCareEmail: null,
        priceIncludesTax: false,
        images: [],
        variants: [],
        seller: {
          legalName: '',
          registeredAddress: null,
          customerCareEmail: null,
          customerCarePhone: null,
        },
      }),
    )

    expect(issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining([
        'variants',
        'images',
        'hsnCode',
        'priceIncludesTax',
        'countryOfOrigin',
        'manufacturerName',
        'packerName',
        'netQuantity',
        'unitOfMeasure',
        'unitSalePrice',
        'consumerCareEmail',
        'seller.legalName',
        'seller.registeredAddress',
        'seller.customerCareEmail',
      ]),
    )
    expect(formatPublishIssues(issues)).toMatch(/declarations need attention/)
  })

  it('requires an importer for imported goods but not an Indian manufacturer', () => {
    const imported = validateProductForPublish(
      product({
        countryOfOrigin: 'DE',
        manufacturerName: null,
        manufacturerAddress: null,
        importerName: null,
      }),
    )
    expect(imported.map((issue) => issue.field)).toContain('importerName')
    expect(imported.map((issue) => issue.field)).toContain('manufacturerName')

    const declared = validateProductForPublish(
      product({
        countryOfOrigin: 'DE',
        manufacturerName: null,
        manufacturerAddress: null,
        importerName: 'Example Imports Pvt Ltd',
      }),
    )
    expect(declared.map((issue) => issue.field)).not.toContain('manufacturerName')
    expect(declared).toEqual([])
  })

  it('rejects inactive variants, non-positive prices and MRP below selling price', () => {
    const issues = validateProductForPublish(
      product({
        variants: [
          { sku: 'OFF', isActive: false, price: '0', mrp: '0' },
          { sku: 'BAD', isActive: true, price: '2000', mrp: '1500' },
        ],
      }),
    )
    expect(issues.map((issue) => issue.field)).toEqual(['variants.BAD.mrp'])
  })

  it('enforces required category attributes', () => {
    const issues = validateProductForPublish(product({ attributeValues: [] }), {
      requiredAttributeCodes: ['color', 'material'],
    })
    expect(issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['attributeValues.color', 'attributeValues.material']),
    )

    const satisfied = validateProductForPublish(
      product({
        attributeValues: [
          { attribute: { code: 'color' } },
          { attribute: { code: 'material' } },
        ] as never,
      }),
      { requiredAttributeCodes: ['color'] },
    )
    expect(satisfied).toEqual([])
  })
})
