import type { Metadata } from 'next'
import Link from 'next/link'

import { AccessDenied } from '@/components/admin/access-denied'
import { ActionForm } from '@/components/admin/action-form'
import {
  AdminPageHeader,
  Card,
  CheckboxField,
  Field,
  SelectField,
  TextAreaField,
  TextField,
  inputClass,
} from '@/components/admin/form-fields'
import { csrfTokenForForm, getCurrentActor, getCurrentSession } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/permissions'
import { getBrands, getCategoryTree, type CategoryTreeNode } from '@/modules/catalog'

import { createProductAction } from '../../actions'

export const metadata: Metadata = { title: 'New product' }

export const dynamic = 'force-dynamic'

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

export default async function NewProductPage() {
  const actor = await getCurrentActor()
  if (!actor || !hasPermission(actor.permissions, 'catalog:write')) {
    return <AccessDenied permission="catalog:write" />
  }
  const session = await getCurrentSession()
  const csrfToken = await csrfTokenForForm(session?.kind)
  const [categories, brands] = await Promise.all([
    getCategoryTree(),
    getBrands({ includeInactive: true }),
  ])
  const categoryOptions = flatten(categories)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog · Products"
        title="New product"
        description="Products are created as drafts. Add declarations, images and variants before publishing."
        actions={
          <Link
            href="/admin/catalog/products"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All products
          </Link>
        }
      />

      <ActionForm action={createProductAction} submitLabel="Create draft" pendingLabel="Creating…">
        <input type="hidden" name="csrfToken" value={csrfToken} />

        <Card title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Product name" name="name" required />
            <TextField label="Slug" name="slug" placeholder="generated-from-name" />
            <TextField label="Base SKU" name="baseSku" required />
            <Field label="Category">
              <select name="categoryId" className={inputClass} required defaultValue="">
                <option value="" disabled>
                  Choose a category
                </option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand (optional)">
              <select name="brandId" className={inputClass} defaultValue="">
                <option value="">No brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </Field>
            <TextField label="HSN code" name="hsnCode" placeholder="94036000" />
          </div>
          <TextAreaField label="Short description" name="shortDescription" rows={2} />
          <TextAreaField label="Description" name="description" rows={5} />
        </Card>

        <Card title="First variant">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Variant SKU" name="variantSku" required />
            <TextField
              label="Variant name"
              name="variantName"
              placeholder="Defaults to product name"
            />
            <TextField label="Selling price (₹)" name="price" type="number" required />
            <TextField label="MRP (₹)" name="mrp" type="number" required />
            <TextField label="Cost price (₹)" name="costPrice" type="number" />
            <TextField label="Tax rate (%)" name="taxRate" type="number" />
            <TextField label="Weight (g)" name="weightGrams" type="number" />
            <TextField label="Length (mm)" name="lengthMm" type="number" />
            <TextField label="Width (mm)" name="widthMm" type="number" />
            <TextField label="Height (mm)" name="heightMm" type="number" />
          </div>
        </Card>

        <Card title="Primary image">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Image URL" name="imageUrl" placeholder="https://…" />
            <TextField label="Alt text" name="imageAlt" placeholder="Walnut sofa, three seats" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Publishing requires at least one image with descriptive alt text.
          </p>
        </Card>

        <Card title="Legal Metrology declarations">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="GST rate (%)" name="gstRate" type="number" defaultValue={18} />
            <TextField label="Country of origin" name="countryOfOrigin" defaultValue="IN" />
            <TextField label="Net quantity" name="netQuantity" type="number" />
            <TextField
              label="Unit of measure"
              name="unitOfMeasure"
              placeholder="kg, piece, litre"
            />
            <TextField label="Unit sale price (₹)" name="unitSalePrice" type="number" />
            <TextField label="Manufacturer name" name="manufacturerName" />
            <TextField label="Packer name" name="packerName" />
            <TextField label="Importer name" name="importerName" />
            <TextField label="BIS registration no." name="bisRegistrationNo" />
            <TextField label="Consumer care email" name="consumerCareEmail" type="email" />
            <TextField label="Consumer care phone" name="consumerCarePhone" />
            <TextField label="Warranty (months)" name="warrantyMonths" type="number" />
          </div>
          <TextAreaField label="Manufacturer address" name="manufacturerAddress" rows={2} />
          <div className="mt-4 flex flex-wrap gap-5">
            <CheckboxField
              label="Prices include GST"
              name="priceIncludesTax"
              defaultChecked
              hint="Consumer prices must be tax-inclusive."
            />
            <SelectField
              label="Warranty type"
              name="warrantyType"
              options={WARRANTY_TYPES}
              defaultValue="NONE"
            />
          </div>
        </Card>

        <Card title="Commercial and shipping policy">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              label="Return window (days)"
              name="returnWindowDays"
              type="number"
              defaultValue={7}
            />
            <SelectField
              label="Shipping class"
              name="shippingClass"
              options={SHIPPING_CLASSES}
              defaultValue="STANDARD"
            />
            <TextField label="SEO title" name="metaTitle" />
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            <CheckboxField label="Returnable" name="isReturnable" defaultChecked />
            <CheckboxField label="Replacement allowed" name="replacementAllowed" defaultChecked />
            <CheckboxField label="Assembly required" name="assemblyRequired" />
            <CheckboxField label="Installation required" name="installationRequired" />
            <CheckboxField label="Fragile" name="isFragile" />
            <CheckboxField label="Heavy" name="isHeavy" />
          </div>
        </Card>

        <Card title="SEO">
          <TextField label="Meta description" name="metaDescription" />
          <TextField label="Search keywords" name="searchKeywords" />
        </Card>
      </ActionForm>
    </div>
  )
}
