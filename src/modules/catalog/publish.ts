import type { ProductDetail } from './catalog.repository'

export interface PublishIssue {
  field: string
  message: string
}

function hasValue(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function hasAddress(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).some((entry) => typeof entry === 'string' && entry.trim().length > 0)
}

/**
 * Legal Metrology (Packaged Commodities) Rules and the Consumer Protection
 * (E-Commerce) Rules require the following declarations before a listing can
 * be shown to consumers. This function is deliberately pure so the same rules
 * can be unit-tested and reused by publish, admin previews and imports.
 */
export function validateProductForPublish(
  product: ProductDetail,
  options: { now?: Date; requiredAttributeCodes?: string[] } = {},
): PublishIssue[] {
  const issues: PublishIssue[] = []
  const now = options.now ?? new Date()
  const seller = product.seller
  const activeVariants = product.variants.filter((variant) => variant.isActive)

  if (!hasValue(product.name)) {
    issues.push({ field: 'name', message: 'Product name is required.' })
  }
  if (!hasValue(product.slug)) {
    issues.push({ field: 'slug', message: 'Product slug is required.' })
  }
  if (!product.category || product.category.archivedAt !== null || !product.category.isActive) {
    issues.push({
      field: 'categoryId',
      message: 'Choose an active, non-archived category before publishing.',
    })
  }
  if (activeVariants.length === 0) {
    issues.push({ field: 'variants', message: 'Add at least one active variant.' })
  }

  for (const variant of activeVariants) {
    const price = Number(variant.price.toString())
    const mrp = Number(variant.mrp.toString())
    if (!(price > 0)) {
      issues.push({
        field: `variants.${variant.sku}.price`,
        message: 'Selling price must be greater than zero.',
      })
    }
    if (!(mrp >= price)) {
      issues.push({
        field: `variants.${variant.sku}.mrp`,
        message: 'MRP must be greater than or equal to the selling price.',
      })
    }
  }

  const hasImage = product.images.some((image) => hasValue(image.url) && hasValue(image.alt))
  if (!hasImage) {
    issues.push({
      field: 'images',
      message: 'Add at least one product image with descriptive alt text.',
    })
  }

  if (!hasValue(product.hsnCode) || !/^[0-9]{4,8}$/.test(product.hsnCode)) {
    issues.push({ field: 'hsnCode', message: 'Enter a valid 4–8 digit HSN code.' })
  }

  const gstRate = Number(product.gstRate.toString())
  if (!(gstRate >= 0 && gstRate <= 100)) {
    issues.push({ field: 'gstRate', message: 'GST rate must be between 0 and 100.' })
  }

  if (!product.priceIncludesTax) {
    issues.push({
      field: 'priceIncludesTax',
      message: 'Consumer-facing prices must be displayed inclusive of GST.',
    })
  }

  if (!hasValue(product.countryOfOrigin)) {
    issues.push({ field: 'countryOfOrigin', message: 'Country of origin is required.' })
  }

  if (!hasValue(product.manufacturerName) || !hasValue(product.manufacturerAddress)) {
    if (product.countryOfOrigin !== 'IN' && hasValue(product.importerName)) {
      // Imported goods must name the importer, packer and origin.
    } else {
      issues.push({
        field: 'manufacturerName',
        message: 'Manufacturer name and address (or importer name for imported goods) are required.',
      })
    }
  }

  if (!hasValue(product.packerName)) {
    issues.push({ field: 'packerName', message: 'Packer name is required.' })
  }

  if (!hasValue(product.importerName) && product.countryOfOrigin !== 'IN') {
    issues.push({
      field: 'importerName',
      message: 'Importer name is required for products not made in India.',
    })
  }

  const netQuantity = product.netQuantity ? Number(product.netQuantity.toString()) : null
  if (netQuantity === null || !(netQuantity > 0)) {
    issues.push({ field: 'netQuantity', message: 'Net quantity must be greater than zero.' })
  }
  if (!hasValue(product.unitOfMeasure)) {
    issues.push({ field: 'unitOfMeasure', message: 'Unit of measure is required.' })
  }
  const unitSalePrice = product.unitSalePrice ? Number(product.unitSalePrice.toString()) : null
  if (unitSalePrice === null || !(unitSalePrice > 0)) {
    issues.push({ field: 'unitSalePrice', message: 'Unit sale price is required.' })
  }

  if (!hasValue(product.consumerCareEmail) && !hasValue(seller.customerCareEmail)) {
    if (!hasValue(product.consumerCarePhone) && !hasValue(seller.customerCarePhone)) {
      issues.push({
        field: 'consumerCareEmail',
        message: 'A consumer care email or phone number is required.',
      })
    }
  }

  if (product.warrantyType !== 'NONE' && (product.warrantyMonths ?? 0) <= 0) {
    issues.push({
      field: 'warrantyMonths',
      message: 'Enter the warranty period in months or set warranty type to none.',
    })
  }

  if (product.isReturnable && (product.returnWindowDays ?? product.category?.returnWindowDays ?? 0) <= 0) {
    issues.push({
      field: 'returnWindowDays',
      message: 'Returnable products need a positive return window.',
    })
  }

  // Seller identity is a platform-level legal prerequisite, not a product field.
  if (!hasValue(seller.legalName)) {
    issues.push({ field: 'seller.legalName', message: 'Seller legal name is not configured.' })
  }
  if (!hasAddress(seller.registeredAddress)) {
    issues.push({
      field: 'seller.registeredAddress',
      message: 'Seller registered address is not configured.',
    })
  }
  if (!hasValue(seller.customerCareEmail) && !hasValue(seller.customerCarePhone)) {
    issues.push({
      field: 'seller.customerCareEmail',
      message: 'Seller consumer care contact is not configured.',
    })
  }

  if (product.publishedAt && product.publishedAt > now) {
    issues.push({
      field: 'publishedAt',
      message: 'Publication time cannot be in the future.',
    })
  }

  const presentAttributes = new Set(product.attributeValues.map((value) => value.attribute.code))
  for (const code of options.requiredAttributeCodes ?? []) {
    if (!presentAttributes.has(code)) {
      issues.push({
        field: `attributeValues.${code}`,
        message: `The category requires the “${code}” attribute.`,
      })
    }
  }

  return issues
}

export function formatPublishIssues(issues: PublishIssue[]): string {
  if (issues.length === 0) return 'Product is ready to publish.'
  return `${issues.length} declaration${issues.length === 1 ? '' : 's'} need attention before publishing.`
}
