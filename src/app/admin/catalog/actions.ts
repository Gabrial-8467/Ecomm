'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ZodError } from 'zod'

import type { Actor } from '@/lib/auth/sessions'
import { verifyCsrfForCurrentSession, requirePermissionActor } from '@/lib/auth/guards'
import type { ActionResult } from '@/lib/admin/action-result'
import { isAppError } from '@/lib/errors'
import type { Permission } from '@/lib/permissions'
import {
  addProductImage,
  addSpecification,
  addVariant,
  archiveProduct,
  attributeInputSchema,
  attributeUpdateSchema,
  brandInputSchema,
  brandUpdateSchema,
  categoryAttributeAssignmentSchema,
  categoryInputSchema,
  categoryUpdateSchema,
  createAttribute,
  createBrand,
  createCategory,
  createProduct,
  deleteAttribute,
  deleteBrand,
  deleteCategory,
  deleteProduct,
  deleteProductImage,
  deleteSpecification,
  deleteVariant,
  generateVariantMatrixForProduct,
  productAttributeValueInputSchema,
  productImageInputSchema,
  productInputSchema,
  productPriceInputSchema,
  productUpdateSchema,
  publishProduct,
  removeProductAttribute,
  setCategoryAttributes,
  setProductAttribute,
  specificationInputSchema,
  updateAttribute,
  updateBrand,
  updateCategory,
  updateProduct,
  updateVariant,
  variantInputSchema,
  variantMatrixSchema,
  variantUpdateSchema,
} from '@/modules/catalog'

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === 'on' || formData.get(name) === 'true' || formData.get(name) === '1'
}

function failure(error: unknown): ActionResult {
  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
    )
    return {
      status: 'error',
      message: 'Please fix the highlighted fields and try again.',
      fieldErrors,
    }
  }
  if (isAppError(error)) {
    const details = Array.isArray(error.details)
      ? Object.fromEntries(
          error.details.map((entry, index) => {
            if (entry && typeof entry === 'object' && 'field' in entry && 'message' in entry) {
              return [
                String((entry as { field: unknown }).field),
                String((entry as { message: unknown }).message),
              ]
            }
            return [`issue_${index}`, String(entry)]
          }),
        )
      : undefined
    return { status: 'error', message: error.message, fieldErrors: details }
  }
  console.error('catalog action failed', error)
  return { status: 'error', message: 'Something went wrong. Please try again.' }
}

async function requireAccess(permission: Permission, formData: FormData): Promise<Actor> {
  const actor = await requirePermissionActor(permission)
  await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())
  return actor
}

function revalidateCatalog(productId?: string) {
  revalidatePath('/admin/catalog')
  revalidatePath('/admin/catalog/categories')
  revalidatePath('/admin/catalog/brands')
  revalidatePath('/admin/catalog/attributes')
  revalidatePath('/admin/catalog/products')
  revalidatePath('/products')
  revalidatePath('/categories')
  if (productId) revalidatePath(`/admin/catalog/products/${productId}`)
}

function parseOptions(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [valuePart, labelPart] = line.split('|').map((part) => part.trim())
      const value = valuePart || labelPart || `option-${index + 1}`
      return {
        value,
        label: labelPart || value,
        sortOrder: index,
        isActive: true,
      }
    })
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategoryAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let categoryId: string
  try {
    const actor = await requireAccess('catalog:write', formData)
    const input = categoryInputSchema.parse({
      name: text(formData, 'name'),
      slug: text(formData, 'slug'),
      parentId: text(formData, 'parentId') || null,
      description: text(formData, 'description'),
      imageUrl: text(formData, 'imageUrl'),
      icon: text(formData, 'icon'),
      isActive: checked(formData, 'isActive'),
      sortOrder: text(formData, 'sortOrder') || '0',
      seoTitle: text(formData, 'seoTitle'),
      seoDescription: text(formData, 'seoDescription'),
      returnWindowDays: text(formData, 'returnWindowDays') || '7',
      isReturnable: checked(formData, 'isReturnable'),
      replacementAllowed: checked(formData, 'replacementAllowed'),
      warrantyMonths: text(formData, 'warrantyMonths'),
      shippingClass: text(formData, 'shippingClass') || 'STANDARD',
    })
    const category = await createCategory(input, actor.userId)
    categoryId = category.id
  } catch (error) {
    return failure(error)
  }
  revalidateCatalog()
  redirect(`/admin/catalog/categories/${categoryId}`)
}

export async function updateCategoryAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const id = text(formData, 'id')
    const input = categoryUpdateSchema.parse({
      name: text(formData, 'name'),
      slug: text(formData, 'slug'),
      parentId: text(formData, 'parentId') || null,
      description: text(formData, 'description'),
      imageUrl: text(formData, 'imageUrl'),
      icon: text(formData, 'icon'),
      isActive: checked(formData, 'isActive'),
      sortOrder: text(formData, 'sortOrder') || '0',
      seoTitle: text(formData, 'seoTitle'),
      seoDescription: text(formData, 'seoDescription'),
      returnWindowDays: text(formData, 'returnWindowDays') || '0',
      isReturnable: checked(formData, 'isReturnable'),
      replacementAllowed: checked(formData, 'replacementAllowed'),
      warrantyMonths: text(formData, 'warrantyMonths'),
      shippingClass: text(formData, 'shippingClass') || 'STANDARD',
    })
    await updateCategory(id, input, actor.userId)
    revalidateCatalog()
    return { status: 'success', message: 'Category updated.' }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteCategoryAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:delete', formData)
    await deleteCategory(text(formData, 'id'), actor.userId)
    revalidateCatalog()
    return { status: 'success', message: 'Category deleted.' }
  } catch (error) {
    return failure(error)
  }
}

export async function setCategoryAttributesAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const categoryId = text(formData, 'categoryId')
    const attributeIds = formData.getAll('attributeId').map(String)
    const assignments = attributeIds.map((attributeId, index) => ({
      attributeId,
      isRequired: checked(formData, `required_${attributeId}`),
      isFilterable: true,
      sortOrder: index,
    }))
    const input = categoryAttributeAssignmentSchema.parse({ attributes: assignments })
    await setCategoryAttributes(categoryId, input.attributes, actor.userId)
    revalidateCatalog()
    return { status: 'success', message: 'Category attributes updated.' }
  } catch (error) {
    return failure(error)
  }
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export async function createBrandAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let brandId: string
  try {
    const actor = await requireAccess('catalog:write', formData)
    const input = brandInputSchema.parse({
      name: text(formData, 'name'),
      slug: text(formData, 'slug'),
      logoUrl: text(formData, 'logoUrl'),
      description: text(formData, 'description'),
      isFeatured: checked(formData, 'isFeatured'),
      isActive: checked(formData, 'isActive'),
      seoTitle: text(formData, 'seoTitle'),
      seoDescription: text(formData, 'seoDescription'),
    })
    const brand = await createBrand(input, actor.userId)
    brandId = brand.id
  } catch (error) {
    return failure(error)
  }
  revalidateCatalog()
  redirect(`/admin/catalog/brands/${brandId}`)
}

export async function updateBrandAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const input = brandUpdateSchema.parse({
      name: text(formData, 'name'),
      slug: text(formData, 'slug'),
      logoUrl: text(formData, 'logoUrl'),
      description: text(formData, 'description'),
      isFeatured: checked(formData, 'isFeatured'),
      isActive: checked(formData, 'isActive'),
      seoTitle: text(formData, 'seoTitle'),
      seoDescription: text(formData, 'seoDescription'),
    })
    await updateBrand(text(formData, 'id'), input, actor.userId)
    revalidateCatalog()
    return { status: 'success', message: 'Brand updated.' }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteBrandAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:delete', formData)
    await deleteBrand(text(formData, 'id'), actor.userId)
    revalidateCatalog()
    return { status: 'success', message: 'Brand deleted.' }
  } catch (error) {
    return failure(error)
  }
}

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

export async function createAttributeAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let attributeId: string
  try {
    const actor = await requireAccess('catalog:write', formData)
    const dataType = text(formData, 'dataType') || 'SELECT'
    const input = attributeInputSchema.parse({
      code: text(formData, 'code'),
      name: text(formData, 'name'),
      dataType,
      unit: text(formData, 'unit'),
      isVariantAxis: checked(formData, 'isVariantAxis'),
      isFilterable: checked(formData, 'isFilterable'),
      isComparable: checked(formData, 'isComparable'),
      sortOrder: text(formData, 'sortOrder') || '0',
      isActive: checked(formData, 'isActive'),
      options:
        dataType === 'SELECT' || dataType === 'MULTI_SELECT'
          ? parseOptions(text(formData, 'options'))
          : [],
    })
    const attribute = await createAttribute(input, actor.userId)
    attributeId = attribute.id
  } catch (error) {
    return failure(error)
  }
  revalidateCatalog()
  redirect(`/admin/catalog/attributes/${attributeId}`)
}

export async function updateAttributeAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const dataType = text(formData, 'dataType') || 'SELECT'
    const input = attributeUpdateSchema.parse({
      code: text(formData, 'code'),
      name: text(formData, 'name'),
      dataType,
      unit: text(formData, 'unit'),
      isVariantAxis: checked(formData, 'isVariantAxis'),
      isFilterable: checked(formData, 'isFilterable'),
      isComparable: checked(formData, 'isComparable'),
      sortOrder: text(formData, 'sortOrder') || '0',
      isActive: checked(formData, 'isActive'),
      options:
        dataType === 'SELECT' || dataType === 'MULTI_SELECT'
          ? parseOptions(text(formData, 'options'))
          : [],
    })
    await updateAttribute(text(formData, 'id'), input, actor.userId)
    revalidateCatalog()
    return { status: 'success', message: 'Attribute updated.' }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteAttributeAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:delete', formData)
    await deleteAttribute(text(formData, 'id'), actor.userId)
    revalidateCatalog()
    return { status: 'success', message: 'Attribute deleted.' }
  } catch (error) {
    return failure(error)
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

function productFormObject(formData: FormData) {
  return {
    name: text(formData, 'name'),
    slug: text(formData, 'slug'),
    baseSku: text(formData, 'baseSku'),
    categoryId: text(formData, 'categoryId'),
    brandId: text(formData, 'brandId') || null,
    shortDescription: text(formData, 'shortDescription'),
    description: text(formData, 'description'),
    hsnCode: text(formData, 'hsnCode'),
    gstRate: text(formData, 'gstRate') || '18',
    priceIncludesTax: checked(formData, 'priceIncludesTax'),
    countryOfOrigin: text(formData, 'countryOfOrigin') || 'IN',
    manufacturerName: text(formData, 'manufacturerName'),
    manufacturerAddress: text(formData, 'manufacturerAddress'),
    packerName: text(formData, 'packerName'),
    importerName: text(formData, 'importerName'),
    netQuantity: text(formData, 'netQuantity'),
    unitOfMeasure: text(formData, 'unitOfMeasure'),
    unitSalePrice: text(formData, 'unitSalePrice'),
    consumerCareEmail: text(formData, 'consumerCareEmail'),
    consumerCarePhone: text(formData, 'consumerCarePhone'),
    bisRegistrationNo: text(formData, 'bisRegistrationNo'),
    warrantyMonths: text(formData, 'warrantyMonths'),
    warrantyType: text(formData, 'warrantyType') || 'NONE',
    isReturnable: checked(formData, 'isReturnable'),
    returnWindowDays: text(formData, 'returnWindowDays'),
    replacementAllowed: checked(formData, 'replacementAllowed'),
    assemblyRequired: checked(formData, 'assemblyRequired'),
    installationRequired: checked(formData, 'installationRequired'),
    isFragile: checked(formData, 'isFragile'),
    isHeavy: checked(formData, 'isHeavy'),
    shippingClass: text(formData, 'shippingClass') || 'STANDARD',
    metaTitle: text(formData, 'metaTitle'),
    metaDescription: text(formData, 'metaDescription'),
    searchKeywords: text(formData, 'searchKeywords'),
  }
}

export async function createProductAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let productId: string
  try {
    const actor = await requireAccess('catalog:write', formData)
    const imageUrl = text(formData, 'imageUrl')
    const imageAlt = text(formData, 'imageAlt')
    const input = productInputSchema.parse({
      ...productFormObject(formData),
      variants: [
        {
          sku: text(formData, 'variantSku'),
          name: text(formData, 'variantName') || text(formData, 'name'),
          price: text(formData, 'price') || '0',
          mrp: text(formData, 'mrp') || '0',
          costPrice: text(formData, 'costPrice'),
          taxRate: text(formData, 'taxRate'),
          weightGrams: text(formData, 'weightGrams'),
          lengthMm: text(formData, 'lengthMm'),
          widthMm: text(formData, 'widthMm'),
          heightMm: text(formData, 'heightMm'),
          isDefault: true,
          isActive: true,
          position: 0,
        },
      ],
      images:
        imageUrl && imageAlt
          ? [{ url: imageUrl, alt: imageAlt, isPrimary: true, sortOrder: 0 }]
          : [],
    })
    const product = await createProduct(input, actor.userId)
    productId = product.id
  } catch (error) {
    return failure(error)
  }
  revalidateCatalog(productId)
  redirect(`/admin/catalog/products/${productId}`)
}

export async function updateProductAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const id = text(formData, 'id')
    const input = productUpdateSchema.parse(productFormObject(formData))
    await updateProduct(id, input, actor.userId)
    revalidateCatalog(id)
    return { status: 'success', message: 'Product details updated.' }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteProductAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:delete', formData)
    await deleteProduct(text(formData, 'id'), actor.userId)
    revalidateCatalog()
    return { status: 'success', message: 'Product deleted.' }
  } catch (error) {
    return failure(error)
  }
}

export async function publishProductAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:publish', formData)
    const id = text(formData, 'productId')
    await publishProduct(id, actor.userId)
    revalidateCatalog(id)
    return { status: 'success', message: 'Product published.' }
  } catch (error) {
    return failure(error)
  }
}

export async function archiveProductAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:publish', formData)
    const id = text(formData, 'productId')
    await archiveProduct(id, actor.userId)
    revalidateCatalog(id)
    return { status: 'success', message: 'Product archived.' }
  } catch (error) {
    return failure(error)
  }
}

export async function addVariantAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const productId = text(formData, 'productId')
    const input = variantInputSchema.parse({
      sku: text(formData, 'sku'),
      name: text(formData, 'name'),
      price: text(formData, 'price'),
      mrp: text(formData, 'mrp'),
      costPrice: text(formData, 'costPrice'),
      taxRate: text(formData, 'taxRate'),
      weightGrams: text(formData, 'weightGrams'),
      lengthMm: text(formData, 'lengthMm'),
      widthMm: text(formData, 'widthMm'),
      heightMm: text(formData, 'heightMm'),
      isDefault: checked(formData, 'isDefault'),
      isActive: checked(formData, 'isActive'),
      position: text(formData, 'position') || '0',
    })
    await addVariant(productId, input, actor.userId)
    revalidateCatalog(productId)
    return { status: 'success', message: 'Variant added.' }
  } catch (error) {
    return failure(error)
  }
}

export async function updateVariantAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const productId = text(formData, 'productId')
    const variantId = text(formData, 'variantId')
    const input = variantUpdateSchema.parse({
      sku: text(formData, 'sku'),
      name: text(formData, 'name'),
      price: text(formData, 'price'),
      mrp: text(formData, 'mrp'),
      costPrice: text(formData, 'costPrice'),
      taxRate: text(formData, 'taxRate'),
      weightGrams: text(formData, 'weightGrams'),
      lengthMm: text(formData, 'lengthMm'),
      widthMm: text(formData, 'widthMm'),
      heightMm: text(formData, 'heightMm'),
      isDefault: checked(formData, 'isDefault'),
      isActive: checked(formData, 'isActive'),
      position: text(formData, 'position') || '0',
    })
    await updateVariant(variantId, input, actor.userId, text(formData, 'reason') || undefined)
    revalidateCatalog(productId)
    return { status: 'success', message: 'Variant updated.' }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteVariantAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:delete', formData)
    const productId = text(formData, 'productId')
    await deleteVariant(text(formData, 'variantId'), actor.userId)
    revalidateCatalog(productId)
    return { status: 'success', message: 'Variant deleted.' }
  } catch (error) {
    return failure(error)
  }
}

export async function changePriceAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const productId = text(formData, 'productId')
    const input = productPriceInputSchema.parse({
      price: text(formData, 'price'),
      mrp: text(formData, 'mrp'),
      reason: text(formData, 'reason'),
    })
    await updateVariant(
      text(formData, 'variantId'),
      { price: input.price, mrp: input.mrp },
      actor.userId,
      input.reason,
    )
    revalidateCatalog(productId)
    return { status: 'success', message: 'Price updated and recorded in history.' }
  } catch (error) {
    return failure(error)
  }
}

export async function addImageAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const productId = text(formData, 'productId')
    const input = productImageInputSchema.parse({
      url: text(formData, 'url'),
      alt: text(formData, 'alt'),
      variantId: text(formData, 'variantId') || undefined,
      width: text(formData, 'width'),
      height: text(formData, 'height'),
      sortOrder: text(formData, 'sortOrder') || '0',
      isPrimary: checked(formData, 'isPrimary'),
    })
    await addProductImage(productId, input, actor.userId)
    revalidateCatalog(productId)
    return { status: 'success', message: 'Image added.' }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteImageAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:delete', formData)
    await deleteProductImage(text(formData, 'imageId'), actor.userId)
    revalidateCatalog(text(formData, 'productId'))
    return { status: 'success', message: 'Image removed.' }
  } catch (error) {
    return failure(error)
  }
}

export async function addSpecificationAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const productId = text(formData, 'productId')
    const input = specificationInputSchema.parse({
      group: text(formData, 'group') || 'General',
      label: text(formData, 'label'),
      value: text(formData, 'value'),
      sortOrder: text(formData, 'sortOrder') || '0',
    })
    await addSpecification(productId, input, actor.userId)
    revalidateCatalog(productId)
    return { status: 'success', message: 'Specification added.' }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteSpecificationAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    await deleteSpecification(text(formData, 'specificationId'), actor.userId)
    revalidateCatalog(text(formData, 'productId'))
    return { status: 'success', message: 'Specification removed.' }
  } catch (error) {
    return failure(error)
  }
}

export async function setProductAttributeAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const productId = text(formData, 'productId')
    const input = productAttributeValueInputSchema.parse({
      attributeId: text(formData, 'attributeId'),
      optionId: text(formData, 'optionId') || undefined,
      valueText: text(formData, 'valueText'),
      valueNumber: text(formData, 'valueNumber'),
      valueBoolean:
        formData.get('valueBoolean') === null ? undefined : checked(formData, 'valueBoolean'),
    })
    await setProductAttribute(productId, input, actor.userId)
    revalidateCatalog(productId)
    return { status: 'success', message: 'Product attribute saved.' }
  } catch (error) {
    return failure(error)
  }
}

export async function removeProductAttributeAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    await removeProductAttribute(
      text(formData, 'productId'),
      text(formData, 'attributeId'),
      actor.userId,
    )
    revalidateCatalog(text(formData, 'productId'))
    return { status: 'success', message: 'Product attribute removed.' }
  } catch (error) {
    return failure(error)
  }
}

export async function generateMatrixAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAccess('catalog:write', formData)
    const productId = text(formData, 'productId')
    const input = variantMatrixSchema.parse({
      attributeCodes: formData.getAll('attributeCode').map(String),
      baseSku: text(formData, 'baseSku') || undefined,
      namePrefix: text(formData, 'namePrefix') || undefined,
    })
    const result = await generateVariantMatrixForProduct(productId, input, actor.userId)
    revalidateCatalog(productId)
    return {
      status: 'success',
      message:
        result.created === 0
          ? 'All combinations already exist.'
          : `${result.created} variant${result.created === 1 ? '' : 's'} generated.`,
    }
  } catch (error) {
    return failure(error)
  }
}
