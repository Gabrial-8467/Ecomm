import type { Metadata } from 'next'

import type { PublicProductView } from './catalog.presenter'

type Breadcrumb = { name: string; path: string }

export function productMetadata(product: PublicProductView): Metadata {
  const title = product.seo.title
  const description =
    product.seo.description ||
    `${product.name} at CasaCircuit with transparent pricing, GST invoice and delivery across serviceable Indian pincodes.`
  const images = product.images.slice(0, 4).map((image) => ({
    url: image.url,
    alt: image.alt,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
  }))

  return {
    title,
    description,
    alternates: { canonical: product.seo.canonicalPath },
    openGraph: {
      type: 'website',
      title,
      description,
      url: product.seo.canonicalPath,
      images,
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images.map((image) => image.url),
    },
    robots: { index: true, follow: true },
  }
}

export function productJsonLd(product: PublicProductView) {
  const variants = product.variants
  const lowPrice = variants.length ? Math.min(...variants.map((variant) => variant.price)) : 0
  const highPrice = variants.length ? Math.max(...variants.map((variant) => variant.price)) : 0
  const url = product.seo.canonicalPath

  const offers =
    variants.length === 1
      ? {
          '@type': 'Offer',
          price: variants[0]!.price.toFixed(2),
          priceCurrency: 'INR',
          url,
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: product.declarations.sellerLegalName },
        }
      : {
          '@type': 'AggregateOffer',
          lowPrice: lowPrice.toFixed(2),
          highPrice: highPrice.toFixed(2),
          offerCount: variants.length,
          priceCurrency: 'INR',
          url,
          seller: { '@type': 'Organization', name: product.declarations.sellerLegalName },
        }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.variants[0]?.sku,
    image: product.images.map((image) => image.url),
    url,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    category: product.category.name,
    countryOfOrigin: product.declarations.countryOfOrigin,
    additionalProperty: product.specifications.map((specification) => ({
      '@type': 'PropertyValue',
      name: specification.label,
      value: specification.value,
    })),
    offers,
    // Ratings are emitted only when real moderated reviews exist. Zero-review
    // products must not advertise fabricated aggregate ratings.
    ...(product.rating.reviews > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.average.toFixed(2),
            reviewCount: product.rating.reviews,
          },
        }
      : {}),
  }
}

export function breadcrumbJsonLd(items: Breadcrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path,
    })),
  }
}

export function categoryMetadata(category: {
  name: string
  slug: string
  seoTitle: string | null
  seoDescription: string | null
  description: string | null
}): Metadata {
  const title = category.seoTitle ?? category.name
  const description =
    category.seoDescription ??
    category.description ??
    `Shop ${category.name} at CasaCircuit with transparent pricing and GST invoices.`
  return {
    title,
    description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title, description, url: `/categories/${category.slug}` },
  }
}

export function itemListJsonLd(
  name: string,
  items: { name: string; url: string; image?: string | null }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.image ? { image: item.image } : {}),
    })),
  }
}
