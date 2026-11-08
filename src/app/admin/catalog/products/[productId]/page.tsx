import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import {
  AdminPageHeader,
  Card,
  CheckboxField,
  Field,
  StatusBadge,
  TextAreaField,
  TextField,
  inputClass,
} from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import {
  getAdminProduct,
  getAttributes,
  getBrands,
  getCategoryDetail,
  getCategoryTree,
  type CategoryTreeNode,
} from '@/modules/catalog'

import {
  addImageAction,
  addSpecificationAction,
  addVariantAction,
  archiveProductAction,
  changePriceAction,
  deleteImageAction,
  deleteProductAction,
  deleteSpecificationAction,
  deleteVariantAction,
  generateMatrixAction,
  publishProductAction,
  removeProductAttributeAction,
  setProductAttributeAction,
  updateProductAction,
  updateVariantAction,
} from '../../actions'

export const metadata: Metadata = { title: 'Edit product' }

export const dynamic = 'force-dynamic'

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const SHIPPING_CLASSES = [
  { value: 'STANDARD', label: 'Standard parcel' },
  { value: 'FURNITURE', label: 'Furniture (scheduled)' },
  { value: 'FRAGILE', label: 'Fragile' },
  { value: 'HEAVY', label: 'Heavy / two-person' },
]

const WARRANTY_TYPES = [
  { value: 'NONE', label: 'No warranty' },
  { value: 'MANUFACTURER', label: 'Manufacturer warranty' },
  { value: 'SELLER', label: 'Seller warranty' },
]

function flatten(nodes: CategoryTreeNode[], depth = 0): { id: string; label: string }[] {
  return nodes.flatMap((node) => [
    { id: node.id, label: `${'— '.repeat(depth)}${node.name}` },
    ...flatten(node.children, depth + 1),
  ])
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:read')) {
    return <AccessDenied permission="catalog:read" />
  }
  const { productId } = await params
  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)
  const canWrite = hasPermission(actor.permissions, 'catalog:write')
  const canPublish = hasPermission(actor.permissions, 'catalog:publish')
  const canDelete = hasPermission(actor.permissions, 'catalog:delete')

  const { product, issues } = await getAdminProduct(productId)
  const [categories, brands, attributes, category] = await Promise.all([
    getCategoryTree(),
    getBrands({ includeInactive: true }),
    getAttributes(),
    getCategoryDetail(product.categoryId),
  ])
  const categoryOptions = flatten(categories)
  const variantAxes = attributes.filter((attribute) => attribute.isVariantAxis)
  const existingAttributes = new Map(
    product.attributeValues.map((value) => [value.attributeId, value]),
  )
  const missingCategoryAttributes = category.categoryAttributes
    .filter((entry) => !existingAttributes.has(entry.attributeId))
    .map((entry) => entry.attribute)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={`Catalog · ${product.category.name}`}
        title={product.name}
        description={`${product.baseSku} · /products/${product.slug}`}
        actions={
          <Link
            href="/admin/catalog/products"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All products
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={product.status} />
        {product.publishedAt ? (
          <span className="text-xs text-muted-foreground">
            Published {product.publishedAt.slice(0, 10)}
          </span>
        ) : null}
        {canPublish && product.status !== 'ACTIVE' ? (
          <ActionForm
            action={publishProductAction}
            submitLabel="Publish"
            pendingLabel="Publishing…"
            compact
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="productId" value={product.id} />
          </ActionForm>
        ) : null}
        {canPublish && product.status === 'ACTIVE' ? (
          <ActionForm
            action={archiveProductAction}
            submitLabel="Archive"
            pendingLabel="Archiving…"
            compact
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="productId" value={product.id} />
          </ActionForm>
        ) : null}
      </div>

      {issues.length > 0 ? (
        <section className="rounded-xl border border-warning/40 bg-warning/10 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <AlertTriangle className="size-5" aria-hidden="true" />
            {issues.length} declaration{issues.length === 1 ? '' : 's'} block publishing
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>
                <span className="font-mono text-xs text-muted-foreground">{issue.field}</span> —{' '}
                {issue.message}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
          All declaration checks pass. The product is ready to publish.
        </p>
      )}

      {canWrite ? (
        <Card title="Product details">
          <ActionForm
            action={updateProductAction}
            submitLabel="Save details"
            pendingLabel="Saving…"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="id" value={product.id} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField label="Name" name="name" defaultValue={product.name} required />
              <TextField label="Slug" name="slug" defaultValue={product.slug} required />
              <TextField label="Base SKU" name="baseSku" defaultValue={product.baseSku} required />
              <Field label="Category">
                <select
                  name="categoryId"
                  className={inputClass}
                  defaultValue={product.categoryId}
                  required
                >
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Brand">
                <select name="brandId" className={inputClass} defaultValue={product.brandId ?? ''}>
                  <option value="">No brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </Field>
              <TextField label="HSN code" name="hsnCode" defaultValue={product.hsnCode} />
            </div>
            <TextAreaField
              label="Short description"
              name="shortDescription"
              defaultValue={product.shortDescription}
              rows={2}
            />
            <TextAreaField
              label="Description"
              name="description"
              defaultValue={product.description}
              rows={5}
            />

            <h3 className="pt-2 font-display text-base font-semibold">
              Legal Metrology declarations
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                label="GST rate (%)"
                name="gstRate"
                type="number"
                defaultValue={product.gstRate}
              />
              <TextField
                label="Country of origin"
                name="countryOfOrigin"
                defaultValue={product.countryOfOrigin}
              />
              <TextField
                label="Net quantity"
                name="netQuantity"
                type="number"
                defaultValue={product.netQuantity}
              />
              <TextField
                label="Unit of measure"
                name="unitOfMeasure"
                defaultValue={product.unitOfMeasure}
              />
              <TextField
                label="Unit sale price (₹)"
                name="unitSalePrice"
                type="number"
                defaultValue={product.unitSalePrice}
              />
              <TextField
                label="Manufacturer name"
                name="manufacturerName"
                defaultValue={product.manufacturerName}
              />
              <TextField label="Packer name" name="packerName" defaultValue={product.packerName} />
              <TextField
                label="Importer name"
                name="importerName"
                defaultValue={product.importerName}
              />
              <TextField
                label="BIS registration no."
                name="bisRegistrationNo"
                defaultValue={product.bisRegistrationNo}
              />
              <TextField
                label="Consumer care email"
                name="consumerCareEmail"
                type="email"
                defaultValue={product.consumerCareEmail}
              />
              <TextField
                label="Consumer care phone"
                name="consumerCarePhone"
                defaultValue={product.consumerCarePhone}
              />
              <TextField
                label="Warranty (months)"
                name="warrantyMonths"
                type="number"
                defaultValue={product.warrantyMonths}
              />
            </div>
            <TextAreaField
              label="Manufacturer address"
              name="manufacturerAddress"
              defaultValue={product.manufacturerAddress}
              rows={2}
            />

            <h3 className="pt-2 font-display text-base font-semibold">Commercial policy</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                label="Return window (days)"
                name="returnWindowDays"
                type="number"
                defaultValue={product.returnWindowDays}
              />
              <Field label="Shipping class">
                <select
                  name="shippingClass"
                  className={inputClass}
                  defaultValue={product.shippingClass}
                >
                  {SHIPPING_CLASSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Warranty type">
                <select
                  name="warrantyType"
                  className={inputClass}
                  defaultValue={product.warrantyType}
                >
                  {WARRANTY_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <TextField label="SEO title" name="metaTitle" defaultValue={product.metaTitle} />
              <TextField
                label="SEO description"
                name="metaDescription"
                defaultValue={product.metaDescription}
              />
              <TextField
                label="Search keywords"
                name="searchKeywords"
                defaultValue={product.searchKeywords}
              />
            </div>
            <div className="flex flex-wrap gap-5">
              <CheckboxField
                label="Prices include GST"
                name="priceIncludesTax"
                defaultChecked={product.priceIncludesTax}
              />
              <CheckboxField
                label="Returnable"
                name="isReturnable"
                defaultChecked={product.isReturnable}
              />
              <CheckboxField
                label="Replacement allowed"
                name="replacementAllowed"
                defaultChecked={product.replacementAllowed}
              />
              <CheckboxField
                label="Assembly required"
                name="assemblyRequired"
                defaultChecked={product.assemblyRequired}
              />
              <CheckboxField
                label="Installation required"
                name="installationRequired"
                defaultChecked={product.installationRequired}
              />
              <CheckboxField label="Fragile" name="isFragile" defaultChecked={product.isFragile} />
              <CheckboxField label="Heavy" name="isHeavy" defaultChecked={product.isHeavy} />
            </div>
          </ActionForm>
        </Card>
      ) : null}

      <Card
        title={`Variants (${product.variants.length})`}
        description="Each variant keeps an immutable price history. Generate combinations from the configured variant axes."
      >
        <div className="space-y-3">
          {product.variants.map((variant) => (
            <details key={variant.id} className="rounded-lg border border-border">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="flex flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {variant.name}
                    {variant.isDefault ? (
                      <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase">
                        Default
                      </span>
                    ) : null}
                    {!variant.isActive ? (
                      <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[0.625rem] font-medium uppercase">
                        Inactive
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{variant.sku}</span>
                </span>
                <span className="flex items-center gap-4 text-sm tabular-nums">
                  <span>{money.format(Number(variant.price))}</span>
                  <span className="text-xs text-muted-foreground line-through">
                    {money.format(Number(variant.mrp))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {variant.attributeValues
                      .map((value) => value.optionLabel ?? value.valueText ?? value.valueNumber)
                      .filter(Boolean)
                      .join(' · ') || 'No axes'}
                  </span>
                </span>
              </summary>
              <div className="space-y-4 border-t border-border px-4 py-4">
                {canWrite ? (
                  <>
                    <ActionForm
                      action={updateVariantAction}
                      submitLabel="Save variant"
                      pendingLabel="Saving…"
                    >
                      <input type="hidden" name="csrfToken" value={csrfToken} />
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="variantId" value={variant.id} />
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <TextField label="SKU" name="sku" defaultValue={variant.sku} required />
                        <TextField label="Name" name="name" defaultValue={variant.name} required />
                        <TextField
                          label="Price (₹)"
                          name="price"
                          type="number"
                          defaultValue={variant.price}
                          required
                        />
                        <TextField
                          label="MRP (₹)"
                          name="mrp"
                          type="number"
                          defaultValue={variant.mrp}
                          required
                        />
                        <TextField
                          label="Cost (₹)"
                          name="costPrice"
                          type="number"
                          defaultValue={variant.costPrice}
                        />
                        <TextField
                          label="Tax rate (%)"
                          name="taxRate"
                          type="number"
                          defaultValue={variant.taxRate}
                        />
                        <TextField
                          label="Weight (g)"
                          name="weightGrams"
                          type="number"
                          defaultValue={variant.weightGrams}
                        />
                        <TextField
                          label="Position"
                          name="position"
                          type="number"
                          defaultValue={variant.position}
                        />
                        <TextField
                          label="Length (mm)"
                          name="lengthMm"
                          type="number"
                          defaultValue={variant.lengthMm}
                        />
                        <TextField
                          label="Width (mm)"
                          name="widthMm"
                          type="number"
                          defaultValue={variant.widthMm}
                        />
                        <TextField
                          label="Height (mm)"
                          name="heightMm"
                          type="number"
                          defaultValue={variant.heightMm}
                        />
                        <TextField
                          label="Reason for change"
                          name="reason"
                          placeholder="Price revision"
                        />
                      </div>
                      <div className="flex flex-wrap gap-5">
                        <CheckboxField
                          label="Active"
                          name="isActive"
                          defaultChecked={variant.isActive}
                        />
                        <CheckboxField
                          label="Default variant"
                          name="isDefault"
                          defaultChecked={variant.isDefault}
                        />
                      </div>
                    </ActionForm>
                    <div className="flex flex-wrap gap-4">
                      <ActionForm
                        action={changePriceAction}
                        submitLabel="Record price change"
                        pendingLabel="Recording…"
                        compact
                        className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                      >
                        <input type="hidden" name="csrfToken" value={csrfToken} />
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="variantId" value={variant.id} />
                        <TextField
                          label="New price (₹)"
                          name="price"
                          type="number"
                          defaultValue={variant.price}
                          required
                        />
                        <TextField
                          label="New MRP (₹)"
                          name="mrp"
                          type="number"
                          defaultValue={variant.mrp}
                          required
                        />
                        <TextField label="Reason" name="reason" placeholder="Promotion" />
                      </ActionForm>
                      {canDelete ? (
                        <ActionForm
                          action={deleteVariantAction}
                          submitLabel="Delete variant"
                          pendingLabel="Deleting…"
                          compact
                        >
                          <input type="hidden" name="csrfToken" value={csrfToken} />
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="variantId" value={variant.id} />
                        </ActionForm>
                      ) : null}
                    </div>
                  </>
                ) : null}

                <div>
                  <h4 className="text-sm font-semibold">Price history</h4>
                  {variant.priceHistory.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">No recorded prices.</p>
                  ) : (
                    <table className="mt-2 w-full text-left text-xs">
                      <thead className="text-muted-foreground uppercase">
                        <tr>
                          <th className="py-1 font-medium">From</th>
                          <th className="py-1 font-medium">To</th>
                          <th className="py-1 font-medium">Price</th>
                          <th className="py-1 font-medium">MRP</th>
                          <th className="py-1 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variant.priceHistory.map((entry) => (
                          <tr key={entry.id} className="border-t border-border">
                            <td className="py-1 tabular-nums">
                              {entry.effectiveFrom.slice(0, 19).replace('T', ' ')}
                            </td>
                            <td className="py-1 tabular-nums">
                              {entry.effectiveTo
                                ? entry.effectiveTo.slice(0, 19).replace('T', ' ')
                                : 'current'}
                            </td>
                            <td className="py-1 tabular-nums">
                              {money.format(Number(entry.price))}
                            </td>
                            <td className="py-1 tabular-nums">{money.format(Number(entry.mrp))}</td>
                            <td className="py-1 text-muted-foreground">{entry.reason ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>

        {canWrite ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-base font-semibold">Add variant</h3>
              <ActionForm
                action={addVariantAction}
                submitLabel="Add variant"
                pendingLabel="Adding…"
                className="mt-3"
              >
                <input type="hidden" name="csrfToken" value={csrfToken} />
                <input type="hidden" name="productId" value={product.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="SKU" name="sku" required />
                  <TextField label="Name" name="name" required />
                  <TextField label="Price (₹)" name="price" type="number" required />
                  <TextField label="MRP (₹)" name="mrp" type="number" required />
                  <TextField label="Cost (₹)" name="costPrice" type="number" />
                  <TextField label="Tax rate (%)" name="taxRate" type="number" />
                  <TextField label="Weight (g)" name="weightGrams" type="number" />
                  <TextField
                    label="Position"
                    name="position"
                    type="number"
                    defaultValue={product.variants.length}
                  />
                </div>
                <div className="flex flex-wrap gap-5">
                  <CheckboxField label="Active" name="isActive" defaultChecked />
                  <CheckboxField label="Default variant" name="isDefault" />
                </div>
              </ActionForm>
            </div>

            <div>
              <h3 className="font-display text-base font-semibold">Generate variant matrix</h3>
              {variantAxes.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No variant axes are configured. Mark attributes as variant axes first.
                </p>
              ) : (
                <ActionForm
                  action={generateMatrixAction}
                  submitLabel="Generate variants"
                  pendingLabel="Generating…"
                  className="mt-3"
                >
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <input type="hidden" name="productId" value={product.id} />
                  <div className="grid gap-2">
                    {variantAxes.map((attribute) => (
                      <label key={attribute.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="attributeCode"
                          value={attribute.code}
                          className="size-4 rounded border-input accent-primary"
                        />
                        <span className="font-medium">{attribute.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {attribute.code} · {attribute.options.length} options
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="SKU prefix" name="baseSku" defaultValue={product.baseSku} />
                    <TextField label="Name prefix" name="namePrefix" defaultValue={product.name} />
                  </div>
                </ActionForm>
              )}
            </div>
          </div>
        ) : null}
      </Card>

      <Card
        title={`Images (${product.images.length})`}
        description="Alt text is required for accessibility and publishing."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {product.images.map((image) => (
            <div key={image.id} className="rounded-lg border border-border p-3">
              <span className="block aspect-[4/3] overflow-hidden rounded-md bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt}
                  className="size-full object-cover"
                  loading="lazy"
                />
              </span>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{image.alt}</p>
              <p className="mt-1 text-[0.625rem] text-muted-foreground">
                {image.isPrimary ? 'Primary · ' : ''}Order {image.sortOrder}
              </p>
              {canDelete ? (
                <ActionForm
                  action={deleteImageAction}
                  submitLabel="Remove"
                  pendingLabel="Removing…"
                  compact
                  className="mt-2"
                >
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="imageId" value={image.id} />
                </ActionForm>
              ) : null}
            </div>
          ))}
        </div>
        {canWrite ? (
          <div className="mt-5">
            <h3 className="font-display text-base font-semibold">Add image</h3>
            <ActionForm
              action={addImageAction}
              submitLabel="Add image"
              pendingLabel="Adding…"
              className="mt-3"
            >
              <input type="hidden" name="csrfToken" value={csrfToken} />
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Image URL" name="url" required />
                <TextField label="Alt text" name="alt" required />
                <TextField label="Width (px)" name="width" type="number" />
                <TextField label="Height (px)" name="height" type="number" />
                <TextField
                  label="Sort order"
                  name="sortOrder"
                  type="number"
                  defaultValue={product.images.length}
                />
              </div>
              <CheckboxField label="Set as primary" name="isPrimary" />
            </ActionForm>
          </div>
        ) : null}
      </Card>

      <Card title={`Specifications (${product.specifications.length})`}>
        <ul className="divide-y divide-border text-sm">
          {product.specifications.map((specification) => (
            <li key={specification.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="text-xs text-muted-foreground">{specification.group}</span>
                <span className="ml-2 font-medium">{specification.label}</span>
                <span className="ml-2 text-muted-foreground">{specification.value}</span>
              </span>
              {canWrite ? (
                <ActionForm
                  action={deleteSpecificationAction}
                  submitLabel="Remove"
                  pendingLabel="Removing…"
                  compact
                >
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="specificationId" value={specification.id} />
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>
        {canWrite ? (
          <div className="mt-5">
            <h3 className="font-display text-base font-semibold">Add specification</h3>
            <ActionForm
              action={addSpecificationAction}
              submitLabel="Add specification"
              pendingLabel="Adding…"
              className="mt-3"
            >
              <input type="hidden" name="csrfToken" value={csrfToken} />
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TextField label="Group" name="group" defaultValue="General" />
                <TextField label="Label" name="label" required />
                <TextField label="Value" name="value" required />
                <TextField
                  label="Sort order"
                  name="sortOrder"
                  type="number"
                  defaultValue={product.specifications.length}
                />
              </div>
            </ActionForm>
          </div>
        ) : null}
      </Card>

      <Card
        title="Attributes"
        description="Structured attributes power storefront filters. Required category attributes must be present to publish."
      >
        <ul className="divide-y divide-border text-sm">
          {product.attributeValues.map((value) => (
            <li key={value.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-medium">{value.name}</span>
                <span className="ml-2 text-muted-foreground">
                  {value.optionLabel ??
                    value.valueText ??
                    value.valueNumber ??
                    (value.valueBoolean === null ? '—' : value.valueBoolean ? 'Yes' : 'No')}
                </span>
              </span>
              {canWrite ? (
                <ActionForm
                  action={removeProductAttributeAction}
                  submitLabel="Remove"
                  pendingLabel="Removing…"
                  compact
                >
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="attributeId" value={value.attributeId} />
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>

        {canWrite && missingCategoryAttributes.length > 0 ? (
          <div className="mt-5 space-y-4">
            <h3 className="font-display text-base font-semibold">Add category attribute</h3>
            {missingCategoryAttributes.map((attribute) => (
              <ActionForm
                key={attribute.id}
                action={setProductAttributeAction}
                submitLabel={`Save ${attribute.name}`}
                pendingLabel="Saving…"
                compact
                className="rounded-md border border-border p-3"
              >
                <input type="hidden" name="csrfToken" value={csrfToken} />
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="attributeId" value={attribute.id} />
                <p className="text-sm font-medium">
                  {attribute.name}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {attribute.code}
                  </span>
                </p>
                {attribute.dataType === 'SELECT' || attribute.dataType === 'MULTI_SELECT' ? (
                  <Field label="Option">
                    <select name="optionId" className={inputClass} required defaultValue="">
                      <option value="" disabled>
                        Choose an option
                      </option>
                      {attribute.options
                        .filter((option) => option.isActive)
                        .map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </Field>
                ) : attribute.dataType === 'NUMBER' ? (
                  <TextField
                    label={attribute.unit ? `Value (${attribute.unit})` : 'Value'}
                    name="valueNumber"
                    type="number"
                    required
                  />
                ) : attribute.dataType === 'BOOLEAN' ? (
                  <Field label="Value">
                    <select name="valueBoolean" className={inputClass} defaultValue="true">
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </Field>
                ) : (
                  <TextField label="Value" name="valueText" required />
                )}
              </ActionForm>
            ))}
          </div>
        ) : null}
      </Card>

      {canDelete ? (
        <Card title="Danger zone" description="Products with order history can only be archived.">
          <ActionForm
            action={deleteProductAction}
            submitLabel="Delete product"
            pendingLabel="Deleting…"
            compact
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="id" value={product.id} />
          </ActionForm>
        </Card>
      ) : null}
    </div>
  )
}
