import type { ProductCard, ProductDetail } from './catalog.repository'

const DAY_MS = 24 * 60 * 60 * 1_000

function decimalToString(value: { toString(): string } | null | undefined): string | null {
  return value === null || value === undefined ? null : value.toString()
}

export interface PriceSummary {
  minPrice: number
  maxPrice: number
  minMrp: number
  maxMrp: number
  discountPercent: number
  lowestPrice30Days: number | null
  priorPrice: number | null
}

/**
 * Price summary derived from the authoritative variant rows and immutable
 * price history. The prior price shown in marketing is the lowest price the
 * product was offered at in the last 30 days, never a fabricated MRP.
 */
export function priceSummary(product: ProductDetail, now = new Date()): PriceSummary {
  const activeVariants = product.variants.filter((variant) => variant.isActive)
  const prices = activeVariants.map((variant) => Number(variant.price.toString()))
  const mrps = activeVariants.map((variant) => Number(variant.mrp.toString()))
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const minMrp = mrps.length ? Math.min(...mrps) : 0
  const maxMrp = mrps.length ? Math.max(...mrps) : 0
  const discountPercent =
    minMrp > 0 && minPrice < minMrp ? Math.round(((minMrp - minPrice) / minMrp) * 100) : 0

  const cutoff = now.getTime() - 30 * DAY_MS
  const historicalPrices = product.variants.flatMap((variant) =>
    variant.priceHistory
      .filter((entry) => {
        const from = entry.effectiveFrom.getTime()
        const to = entry.effectiveTo?.getTime() ?? Number.POSITIVE_INFINITY
        return to >= cutoff && from <= now.getTime()
      })
      .map((entry) => Number(entry.price.toString())),
  )
  const considered = [...prices, ...historicalPrices]
  const lowestPrice30Days = considered.length ? Math.min(...considered) : null

  return {
    minPrice,
    maxPrice,
    minMrp,
    maxMrp,
    discountPercent,
    lowestPrice30Days,
    priorPrice:
      lowestPrice30Days !== null && lowestPrice30Days < minPrice ? lowestPrice30Days : null,
  }
}

export function productCardView(product: ProductCard) {
  const active = product.variants
  const prices = active.map((variant) => Number(variant.price.toString()))
  const mrps = active.map((variant) => Number(variant.mrp.toString()))
  const minPrice = prices.length ? Math.min(...prices) : 0
  const minMrp = mrps.length ? Math.min(...mrps) : 0
  const primary = product.images[0] ?? null
  const cheapest = active[0] ?? null

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    category: product.category,
    brand: product.brand,
    image: primary,
    price: {
      min: minPrice,
      max: prices.length ? Math.max(...prices) : 0,
      mrp: minMrp,
      discountPercent:
        minMrp > 0 && minPrice < minMrp ? Math.round(((minMrp - minPrice) / minMrp) * 100) : 0,
    },
    defaultVariantId: cheapest?.id ?? null,
    rating: {
      average: Number(product.ratingAvg.toString()),
      count: product.ratingCount,
      reviews: product.reviewCount,
    },
    soldCount: product.soldCount,
    publishedAt: product.publishedAt?.toISOString() ?? null,
  }
}

export function productDetailView(product: ProductDetail, now = new Date()) {
  const price = priceSummary(product, now)
  const activeVariants = product.variants.filter((variant) => variant.isActive)
  const defaultVariant = activeVariants.find((variant) => variant.isDefault) ?? activeVariants[0]

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
      path: product.category.path,
      level: product.category.level,
    },
    brand: product.brand
      ? { id: product.brand.id, name: product.brand.name, slug: product.brand.slug }
      : null,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      width: image.width,
      height: image.height,
      blurDataUrl: image.blurDataUrl,
      variantId: image.variantId,
      isPrimary: image.isPrimary,
    })),
    variants: activeVariants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: Number(variant.price.toString()),
      mrp: Number(variant.mrp.toString()),
      isDefault: variant.isDefault,
      attributes: Object.fromEntries(
        variant.attributeValues.map((value) => [
          value.attribute.code,
          value.option?.label ?? value.valueText ?? decimalToString(value.valueNumber) ?? '',
        ]),
      ),
    })),
    defaultVariantId: defaultVariant?.id ?? null,
    price,
    attributes: product.attributeValues.map((value) => ({
      code: value.attribute.code,
      name: value.attribute.name,
      unit: value.attribute.unit,
      value:
        value.option?.label ??
        value.valueText ??
        (value.valueBoolean !== null ? (value.valueBoolean ? 'Yes' : 'No') : null) ??
        decimalToString(value.valueNumber),
    })),
    specifications: product.specifications.map((specification) => ({
      group: specification.group,
      label: specification.label,
      value: specification.value,
    })),
    declarations: {
      sellerLegalName: product.seller.legalName,
      sellerDisplayName: product.seller.displayName,
      sellerRegisteredAddress: product.seller.registeredAddress,
      manufacturerName: product.manufacturerName,
      manufacturerAddress: product.manufacturerAddress,
      packerName: product.packerName,
      importerName: product.importerName,
      countryOfOrigin: product.countryOfOrigin,
      netQuantity: decimalToString(product.netQuantity),
      unitOfMeasure: product.unitOfMeasure,
      unitSalePrice: decimalToString(product.unitSalePrice),
      hsnCode: product.hsnCode,
      gstRate: decimalToString(product.gstRate),
      priceIncludesTax: product.priceIncludesTax,
      consumerCareEmail: product.consumerCareEmail ?? product.seller.customerCareEmail,
      consumerCarePhone: product.consumerCarePhone ?? product.seller.customerCarePhone,
      bisRegistrationNo: product.bisRegistrationNo,
      warrantyType: product.warrantyType,
      warrantyMonths: product.warrantyMonths,
      isReturnable: product.isReturnable,
      returnWindowDays: product.returnWindowDays,
      replacementAllowed: product.replacementAllowed,
      assemblyRequired: product.assemblyRequired,
      installationRequired: product.installationRequired,
    },
    shipping: {
      class: product.shippingClass,
      isFragile: product.isFragile,
      isHeavy: product.isHeavy,
    },
    rating: {
      average: Number(product.ratingAvg.toString()),
      count: product.ratingCount,
      reviews: product.reviewCount,
    },
    soldCount: product.soldCount,
    publishedAt: product.publishedAt?.toISOString() ?? null,
    seo: {
      title: product.metaTitle ?? product.name,
      description: product.metaDescription ?? product.shortDescription ?? '',
      canonicalPath: `/products/${product.slug}`,
    },
  }
}

/** Admin payload: includes cost, history and workflow fields but no secrets. */
export function adminProductView(product: ProductDetail) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    baseSku: product.baseSku,
    status: product.status,
    categoryId: product.categoryId,
    brandId: product.brandId,
    sellerId: product.sellerId,
    shortDescription: product.shortDescription,
    description: product.description,
    hsnCode: product.hsnCode,
    gstRate: decimalToString(product.gstRate),
    priceIncludesTax: product.priceIncludesTax,
    countryOfOrigin: product.countryOfOrigin,
    manufacturerName: product.manufacturerName,
    manufacturerAddress: product.manufacturerAddress,
    packerName: product.packerName,
    importerName: product.importerName,
    netQuantity: decimalToString(product.netQuantity),
    unitOfMeasure: product.unitOfMeasure,
    unitSalePrice: decimalToString(product.unitSalePrice),
    consumerCareEmail: product.consumerCareEmail,
    consumerCarePhone: product.consumerCarePhone,
    bisRegistrationNo: product.bisRegistrationNo,
    warrantyMonths: product.warrantyMonths,
    warrantyType: product.warrantyType,
    isReturnable: product.isReturnable,
    returnWindowDays: product.returnWindowDays,
    replacementAllowed: product.replacementAllowed,
    assemblyRequired: product.assemblyRequired,
    installationRequired: product.installationRequired,
    isFragile: product.isFragile,
    isHeavy: product.isHeavy,
    shippingClass: product.shippingClass,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    searchKeywords: product.searchKeywords,
    publishedAt: product.publishedAt?.toISOString() ?? null,
    archivedAt: product.archivedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    category: product.category,
    brand: product.brand,
    seller: {
      id: product.seller.id,
      legalName: product.seller.legalName,
      displayName: product.seller.displayName,
      customerCareEmail: product.seller.customerCareEmail,
      customerCarePhone: product.seller.customerCarePhone,
      registeredAddress: product.seller.registeredAddress,
    },
    images: product.images,
    specifications: product.specifications,
    attributeValues: product.attributeValues.map((value) => ({
      id: value.id,
      attributeId: value.attributeId,
      code: value.attribute.code,
      name: value.attribute.name,
      optionId: value.optionId,
      optionLabel: value.option?.label ?? null,
      valueText: value.valueText,
      valueNumber: decimalToString(value.valueNumber),
      valueBoolean: value.valueBoolean,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: decimalToString(variant.price),
      mrp: decimalToString(variant.mrp),
      costPrice: decimalToString(variant.costPrice),
      taxRate: decimalToString(variant.taxRate),
      weightGrams: variant.weightGrams,
      lengthMm: variant.lengthMm,
      widthMm: variant.widthMm,
      heightMm: variant.heightMm,
      isDefault: variant.isDefault,
      isActive: variant.isActive,
      position: variant.position,
      attributeValues: variant.attributeValues.map((value) => ({
        attributeId: value.attributeId,
        code: value.attribute.code,
        name: value.attribute.name,
        optionId: value.optionId,
        optionLabel: value.option?.label ?? null,
        valueText: value.valueText,
        valueNumber: decimalToString(value.valueNumber),
      })),
      priceHistory: variant.priceHistory.map((entry) => ({
        id: entry.id,
        price: decimalToString(entry.price),
        mrp: decimalToString(entry.mrp),
        effectiveFrom: entry.effectiveFrom.toISOString(),
        effectiveTo: entry.effectiveTo?.toISOString() ?? null,
        reason: entry.reason,
        changedByUserId: entry.changedByUserId,
      })),
    })),
  }
}

export type PublicProductView = ReturnType<typeof productDetailView>
export type AdminProductView = ReturnType<typeof adminProductView>
export type ProductCardView = ReturnType<typeof productCardView>
