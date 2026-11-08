import { describe, expect, it } from 'vitest'

import type { PublicProductView } from '@/modules/catalog/catalog.presenter'

import {
  breadcrumbJsonLd,
  itemListJsonLd,
  productJsonLd,
  productMetadata,
} from '@/modules/catalog/catalog.seo'

function view(overrides: Record<string, unknown> = {}): PublicProductView {
  const base = {
    name: 'Walnut sofa',
    shortDescription: 'A three-seat walnut sofa.',
    description: 'Long description',
    seo: {
      title: 'Walnut sofa',
      description: 'A three-seat walnut sofa with a solid-wood frame.',
      canonicalPath: '/products/walnut-sofa',
    },
    images: [
      {
        id: 'image_1',
        url: 'https://cdn.example.com/sofa.jpg',
        alt: 'Walnut sofa, three seats',
        width: 1200,
        height: 900,
      },
    ],
    variants: [{ id: 'variant_1', sku: 'SOFA-WAL-3', name: 'Walnut', price: 45000, mrp: 52000 }],
    brand: { id: 'brand_1', name: 'Example Works', slug: 'example-works' },
    category: {
      id: 'category_1',
      name: 'Sofas',
      slug: 'sofas',
      path: '/furniture/sofas',
      level: 1,
    },
    declarations: {
      countryOfOrigin: 'IN',
      sellerLegalName: 'CasaCircuit Retail Private Limited',
    },
    specifications: [{ group: 'Dimensions', label: 'Width', value: '220 cm' }],
    rating: { average: 0, count: 0, reviews: 0 },
    ...overrides,
  }
  return base as unknown as PublicProductView
}

describe('productJsonLd', () => {
  it('omits aggregateRating when there are no verified reviews', () => {
    const jsonLd = productJsonLd(view())
    expect(jsonLd).not.toHaveProperty('aggregateRating')
    expect(jsonLd.offers).toMatchObject({
      '@type': 'Offer',
      price: '45000.00',
      priceCurrency: 'INR',
      seller: { '@type': 'Organization', name: 'CasaCircuit Retail Private Limited' },
    })
    expect(jsonLd.additionalProperty).toEqual([
      { '@type': 'PropertyValue', name: 'Width', value: '220 cm' },
    ])
  })

  it('includes aggregateRating only when real reviews exist', () => {
    const jsonLd = productJsonLd(view({ rating: { average: 4.5, count: 12, reviews: 3 } }))
    expect(jsonLd.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: '4.50',
      reviewCount: 3,
    })
  })

  it('emits an AggregateOffer for multi-variant products', () => {
    const jsonLd = productJsonLd(
      view({
        variants: [
          { id: '1', sku: 'A', name: 'Two seat', price: 32000, mrp: 38000 },
          { id: '2', sku: 'B', name: 'Three seat', price: 45000, mrp: 52000 },
        ],
      }),
    )
    expect(jsonLd.offers).toMatchObject({
      '@type': 'AggregateOffer',
      lowPrice: '32000.00',
      highPrice: '45000.00',
      offerCount: 2,
      priceCurrency: 'INR',
    })
  })
})

describe('metadata and breadcrumb helpers', () => {
  it('builds canonical product metadata and image previews', () => {
    const metadata = productMetadata(view())
    expect(metadata.title).toBe('Walnut sofa')
    expect(metadata.alternates?.canonical).toBe('/products/walnut-sofa')
    expect(metadata.openGraph?.images).toEqual([
      {
        url: 'https://cdn.example.com/sofa.jpg',
        alt: 'Walnut sofa, three seats',
        width: 1200,
        height: 900,
      },
    ])
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })

  it('builds a positioned breadcrumb list', () => {
    expect(
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Sofas', path: '/categories/sofas' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
        { '@type': 'ListItem', position: 2, name: 'Sofas', item: '/categories/sofas' },
      ],
    })
  })

  it('builds an ItemList with optional images', () => {
    expect(
      itemListJsonLd('Sofas', [
        { name: 'Walnut sofa', url: '/products/walnut-sofa', image: 'https://cdn/x.jpg' },
        { name: 'Oak sofa', url: '/products/oak-sofa' },
      ]),
    ).toMatchObject({
      '@type': 'ItemList',
      name: 'Sofas',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Walnut sofa',
          url: '/products/walnut-sofa',
          image: 'https://cdn/x.jpg',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Oak sofa',
          url: '/products/oak-sofa',
        },
      ],
    })
  })
})
