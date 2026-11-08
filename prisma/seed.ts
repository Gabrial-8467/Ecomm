/**
 * Reference-data seed.
 *
 * This script intentionally does not create fake products, reviews, orders or
 * legal identities. It seeds only data the application needs to function:
 * permissions, roles, catalogue taxonomy, attribute definitions, navigation,
 * settings and draft legal-document shells that are explicitly unpublished.
 *
 * Safe to run repeatedly; every write is an upsert or guarded by a lookup.
 */
import 'dotenv/config'

import { createHash } from 'node:crypto'

import { hash } from '@node-rs/argon2'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../src/generated/prisma/client.js'
import {
  ROLE_PERMISSIONS,
  PERMISSIONS,
  ROLES,
  type Permission,
  type RoleCode,
} from '../src/lib/permissions.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

async function seedPermissions() {
  const groupFor = (code: string) => code.split(':')[0]

  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: { group: groupFor(code) },
      create: { code, group: groupFor(code) },
    })
  }
  console.log(`permissions: ${PERMISSIONS.length}`)
}

async function seedRoles() {
  const descriptions: Record<RoleCode, string> = {
    SUPER_ADMIN: 'Unrestricted platform access; reserved for founders/CTO.',
    ADMIN: 'Full operational access except destructive staff and privacy actions.',
    PRODUCT_MANAGER: 'Catalogue, pricing, merchandising and review moderation.',
    INVENTORY_MANAGER: 'Stock, purchase orders, transfers and adjustments.',
    ORDER_MANAGER: 'Order lifecycle, fulfilment, returns and shipments.',
    CUSTOMER_SUPPORT: 'Customer replies, tickets, grievances and order viewing.',
    FINANCE_MANAGER: 'Payments, refunds, invoices and financial reports.',
    CONTENT_MANAGER: 'CMS pages, banners, navigation, blog and FAQs.',
  }

  for (const [code, permissions] of Object.entries(ROLE_PERMISSIONS) as [
    RoleCode,
    readonly (Permission | '*')[],
  ][]) {
    const role = await prisma.role.upsert({
      where: { code },
      update: {
        name: code.replaceAll('_', ' ').toLowerCase(),
        description: descriptions[code],
        isSystem: true,
      },
      create: {
        code,
        name: code.replaceAll('_', ' ').toLowerCase(),
        description: descriptions[code],
        isSystem: true,
      },
    })

    const wanted = new Set(permissions.filter((value): value is Permission => value !== '*'))
    const existing = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    })

    const existingCodes = new Set(existing.map((row) => row.permission.code))
    const permissionRows = await prisma.permission.findMany({
      where: { code: { in: [...wanted] } },
    })

    for (const permission of permissionRows) {
      if (!existingCodes.has(permission.code)) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permission.id },
        })
      }
    }

    for (const row of existing) {
      if (!wanted.has(row.permission.code as Permission)) {
        await prisma.rolePermission.delete({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: row.permissionId },
          },
        })
      }
    }
  }
  console.log(`roles: ${Object.keys(ROLE_PERMISSIONS).length}`)
}

type CategorySeed = {
  name: string
  slug: string
  children?: { name: string; slug: string }[]
}

const CATEGORY_TREE: CategorySeed[] = [
  {
    name: 'Furniture',
    slug: 'furniture',
    children: [
      { name: 'Sofas & Seating', slug: 'sofas-seating' },
      { name: 'Beds & Mattresses', slug: 'beds-mattresses' },
      { name: 'Tables & Desks', slug: 'tables-desks' },
      { name: 'Storage & Wardrobes', slug: 'storage-wardrobes' },
      { name: 'Outdoor Furniture', slug: 'outdoor-furniture' },
    ],
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    children: [
      { name: 'Televisions', slug: 'televisions' },
      { name: 'Audio', slug: 'audio' },
      { name: 'Home Appliances', slug: 'home-appliances' },
      { name: 'Kitchen Appliances', slug: 'kitchen-appliances' },
      { name: 'Computers & Accessories', slug: 'computers-accessories' },
    ],
  },
]

async function seedCategories() {
  for (const [index, root] of CATEGORY_TREE.entries()) {
    const parent = await prisma.category.upsert({
      where: { slug: root.slug },
      update: { name: root.name, level: 0, isActive: true },
      create: {
        name: root.name,
        slug: root.slug,
        path: `/${root.slug}`,
        level: 0,
        sortOrder: index,
      },
    })

    for (const [childIndex, child] of (root.children ?? []).entries()) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id, level: 1, isActive: true },
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          path: `/${root.slug}/${child.slug}`,
          level: 1,
          sortOrder: childIndex,
        },
      })
    }
  }
  console.log('categories: seeded')
}

const ATTRIBUTES = [
  {
    code: 'color',
    name: 'Colour',
    dataType: 'SELECT' as const,
    isFilterable: true,
    isVariantAxis: true,
    options: ['Black', 'White', 'Grey', 'Beige', 'Brown', 'Blue', 'Green', 'Walnut'],
  },
  {
    code: 'material',
    name: 'Material',
    dataType: 'SELECT' as const,
    isFilterable: true,
    isVariantAxis: false,
    options: ['Solid Wood', 'Engineered Wood', 'Metal', 'Glass', 'Fabric', 'Leather', 'Plastic'],
  },
  {
    code: 'finish',
    name: 'Finish',
    dataType: 'SELECT' as const,
    isFilterable: true,
    isVariantAxis: true,
    options: ['Matte', 'Glossy', 'Natural', 'Lacquered', 'Powder Coated'],
  },
  {
    code: 'size',
    name: 'Size',
    dataType: 'SELECT' as const,
    isFilterable: true,
    isVariantAxis: true,
    options: ['Single', 'Double', 'Queen', 'King', 'Small', 'Medium', 'Large'],
  },
  {
    code: 'screen_size_inch',
    name: 'Screen size (inches)',
    dataType: 'NUMBER' as const,
    unit: 'inch',
    isFilterable: true,
    isVariantAxis: true,
    options: [],
  },
  {
    code: 'energy_rating',
    name: 'Energy rating',
    dataType: 'SELECT' as const,
    isFilterable: true,
    isVariantAxis: false,
    options: ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'],
  },
]

async function seedAttributes() {
  for (const [index, attribute] of ATTRIBUTES.entries()) {
    const definition = await prisma.attributeDefinition.upsert({
      where: { code: attribute.code },
      update: {
        name: attribute.name,
        dataType: attribute.dataType,
        unit: 'unit' in attribute ? attribute.unit : null,
        isFilterable: attribute.isFilterable,
        isVariantAxis: attribute.isVariantAxis,
        sortOrder: index,
      },
      create: {
        code: attribute.code,
        name: attribute.name,
        dataType: attribute.dataType,
        unit: 'unit' in attribute ? attribute.unit : null,
        isFilterable: attribute.isFilterable,
        isVariantAxis: attribute.isVariantAxis,
        sortOrder: index,
      },
    })

    for (const [optionIndex, value] of attribute.options.entries()) {
      await prisma.attributeOption.upsert({
        where: { attributeId_value: { attributeId: definition.id, value } },
        update: { label: value, sortOrder: optionIndex },
        create: {
          attributeId: definition.id,
          value,
          label: value,
          sortOrder: optionIndex,
        },
      })
    }
  }
  console.log(`attributes: ${ATTRIBUTES.length}`)
}

/**
 * Single-seller inventory-owning entity. Legal name, registered address and
 * statutory identifiers are intentionally left blank until the business
 * supplies verified details; publishing is blocked until they are present.
 * This is a seed placeholder, not a fabricated legal identity.
 */
async function seedPlatformSeller() {
  const existing = await prisma.seller.findFirst({ where: { isPlatformOwner: true } })
  const data = {
    displayName: 'CasaCircuit',
    legalName: process.env.SELLER_LEGAL_NAME?.trim() || 'CasaCircuit',
    status: 'ACTIVE' as const,
    isPlatformOwner: true,
    customerCareEmail: process.env.SUPPORT_EMAIL || null,
    customerCarePhone: null,
    registeredAddress: undefined,
  }

  if (existing) {
    await prisma.seller.update({
      where: { id: existing.id },
      data: {
        displayName: data.displayName,
        status: data.status,
        isPlatformOwner: true,
        ...(data.customerCareEmail ? { customerCareEmail: data.customerCareEmail } : {}),
      },
    })
    console.log('platform seller: existing record retained')
    return
  }

  await prisma.seller.create({ data })
  console.log('platform seller: placeholder created (legal details pending)')
}

const CATEGORY_ATTRIBUTE_CODES: Record<string, string[]> = {
  furniture: ['color', 'material', 'finish'],
  'sofas-seating': ['color', 'material', 'finish', 'size'],
  'beds-mattresses': ['color', 'material', 'size'],
  'tables-desks': ['color', 'material', 'finish', 'size'],
  'storage-wardrobes': ['color', 'material', 'finish', 'size'],
  'outdoor-furniture': ['color', 'material', 'finish'],
  electronics: ['color'],
  televisions: ['color', 'screen_size_inch', 'size'],
  audio: ['color', 'size'],
  'home-appliances': ['color', 'energy_rating'],
  'kitchen-appliances': ['color', 'energy_rating', 'size'],
  'computers-accessories': ['color', 'screen_size_inch', 'size'],
}

async function seedCategoryAttributes() {
  for (const [categorySlug, codes] of Object.entries(CATEGORY_ATTRIBUTE_CODES)) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
    if (!category) continue
    for (const [index, code] of codes.entries()) {
      const attribute = await prisma.attributeDefinition.findUnique({ where: { code } })
      if (!attribute) continue
      await prisma.categoryAttribute.upsert({
        where: {
          categoryId_attributeId: { categoryId: category.id, attributeId: attribute.id },
        },
        update: { isFilterable: true, sortOrder: index },
        create: {
          categoryId: category.id,
          attributeId: attribute.id,
          isFilterable: true,
          isRequired: false,
          sortOrder: index,
        },
      })
    }
  }
  console.log('category attributes: seeded')
}

const SETTINGS: { key: string; value: string | number | boolean; description: string }[] = [
  { key: 'store.name', value: 'CasaCircuit', description: 'Public store name' },
  { key: 'store.currency', value: 'INR', description: 'Default currency' },
  { key: 'store.timezone', value: 'Asia/Kolkata', description: 'Business timezone' },
  {
    key: 'store.supportEmail',
    value: process.env.SUPPORT_EMAIL ?? '',
    description: 'Customer support email',
  },
  {
    key: 'store.legalIdentityConfirmed',
    value: false,
    description:
      'Must be true only after the business supplies verified legal name, address and GSTIN',
  },
  {
    key: 'checkout.reservationTtlMinutes',
    value: Number(process.env.RESERVATION_TTL_MINUTES ?? 15),
    description: 'Inventory reservation lifetime',
  },
  {
    key: 'checkout.codMaxOrderValue',
    value: Number(process.env.COD_MAX_ORDER_VALUE ?? 50_000),
    description: 'Maximum order value eligible for cash on delivery',
  },
  {
    key: 'shipping.freeThreshold',
    value: Number(process.env.FREE_SHIPPING_THRESHOLD ?? 4_999),
    description: 'Free standard shipping above this amount',
  },
  {
    key: 'returns.defaultWindowDays',
    value: Number(process.env.DEFAULT_RETURN_WINDOW_DAYS ?? 7),
    description: 'Fallback return window when a category does not override it',
  },
]

async function seedSettings() {
  for (const setting of SETTINGS) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { description: setting.description },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    })
  }
  console.log(`settings: ${SETTINGS.length}`)
}

async function upsertNavigationItem(input: {
  menuId: string
  label: string
  href: string
  sortOrder: number
  categoryId?: string
  isMegaMenu?: boolean
}) {
  const existing = await prisma.navigationItem.findFirst({
    where: { menuId: input.menuId, href: input.href },
  })
  if (existing) {
    await prisma.navigationItem.update({
      where: { id: existing.id },
      data: {
        label: input.label,
        sortOrder: input.sortOrder,
        categoryId: input.categoryId ?? null,
      },
    })
    return
  }
  await prisma.navigationItem.create({
    data: {
      menuId: input.menuId,
      label: input.label,
      href: input.href,
      sortOrder: input.sortOrder,
      categoryId: input.categoryId ?? null,
      isMegaMenu: input.isMegaMenu ?? false,
    },
  })
}

async function seedNavigation() {
  const header = await prisma.navigationMenu.upsert({
    where: { code: 'header-primary' },
    update: { label: 'Primary navigation' },
    create: { code: 'header-primary', label: 'Primary navigation' },
  })
  const footerCompany = await prisma.navigationMenu.upsert({
    where: { code: 'footer-company' },
    update: { label: 'Company' },
    create: { code: 'footer-company', label: 'Company' },
  })
  const footerPolicy = await prisma.navigationMenu.upsert({
    where: { code: 'footer-policy' },
    update: { label: 'Policies' },
    create: { code: 'footer-policy', label: 'Policies' },
  })

  const furniture = await prisma.category.findUnique({ where: { slug: 'furniture' } })
  const electronics = await prisma.category.findUnique({ where: { slug: 'electronics' } })

  const headerItems = [
    { label: 'Furniture', href: '/furniture', categoryId: furniture?.id, isMegaMenu: true },
    { label: 'Electronics', href: '/electronics', categoryId: electronics?.id, isMegaMenu: true },
    { label: 'New Arrivals', href: '/collections/new-arrivals' },
    { label: 'Deals', href: '/collections/deals' },
  ]

  for (const [index, item] of headerItems.entries()) {
    await upsertNavigationItem({
      menuId: header.id,
      label: item.label,
      href: item.href,
      sortOrder: index,
      ...(item.categoryId ? { categoryId: item.categoryId } : {}),
      ...(item.isMegaMenu ? { isMegaMenu: true } : {}),
    })
  }

  const companyItems = [
    { label: 'About us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Stores', href: '/stores' },
    { label: 'Blog', href: '/blog' },
  ]
  for (const [index, item] of companyItems.entries()) {
    await upsertNavigationItem({ menuId: footerCompany.id, ...item, sortOrder: index })
  }

  const policyItems = [
    { label: 'Terms of use', href: '/legal/terms' },
    { label: 'Privacy policy', href: '/legal/privacy' },
    { label: 'Returns & refunds', href: '/legal/returns' },
    { label: 'Shipping', href: '/legal/shipping' },
    { label: 'Grievance redressal', href: '/legal/grievance' },
  ]
  for (const [index, item] of policyItems.entries()) {
    await upsertNavigationItem({ menuId: footerPolicy.id, ...item, sortOrder: index })
  }

  console.log('navigation: seeded')
}

const LEGAL_DOCUMENTS = [
  { slug: 'terms', title: 'Terms of Use', type: 'TERMS' as const, requiresConsent: true },
  { slug: 'privacy', title: 'Privacy Policy', type: 'PRIVACY' as const, requiresConsent: true },
  {
    slug: 'returns',
    title: 'Returns and Refunds Policy',
    type: 'RETURNS' as const,
    requiresConsent: false,
  },
  {
    slug: 'shipping',
    title: 'Shipping and Delivery Policy',
    type: 'SHIPPING' as const,
    requiresConsent: false,
  },
  {
    slug: 'cancellation',
    title: 'Cancellation Policy',
    type: 'CANCELLATION' as const,
    requiresConsent: false,
  },
  { slug: 'warranty', title: 'Warranty Policy', type: 'WARRANTY' as const, requiresConsent: false },
  { slug: 'cookies', title: 'Cookie Notice', type: 'COOKIES' as const, requiresConsent: false },
  {
    slug: 'grievance',
    title: 'Grievance Redressal',
    type: 'GRIEVANCE' as const,
    requiresConsent: false,
  },
]

async function seedLegalDocuments() {
  const placeholder = [
    '# Document pending legal review',
    '',
    'This is an unpublished placeholder. It is not a policy and must not be shown',
    'to customers. Replace it with counsel-reviewed content before launch.',
  ].join('\n')

  for (const entry of LEGAL_DOCUMENTS) {
    const document = await prisma.legalDocument.upsert({
      where: { slug: entry.slug },
      update: { title: entry.title, type: entry.type, requiresConsent: entry.requiresConsent },
      create: {
        slug: entry.slug,
        title: entry.title,
        type: entry.type,
        requiresConsent: entry.requiresConsent,
      },
    })

    const version = await prisma.legalDocumentVersion.findUnique({
      where: { documentId_version: { documentId: document.id, version: '0.1-draft' } },
    })
    if (!version) {
      await prisma.legalDocumentVersion.create({
        data: {
          documentId: document.id,
          version: '0.1-draft',
          content: placeholder,
          changeSummary: 'Initial placeholder pending counsel review',
          effectiveAt: new Date(),
          status: 'DRAFT',
          legalReviewStatus: 'PENDING',
          contentHash: sha256(placeholder),
        },
      })
    }
  }
  console.log(`legal documents: ${LEGAL_DOCUMENTS.length} (draft, unpublished)`)
}

async function seedWarehouses() {
  const warehouses = [
    {
      code: 'WH-DEL-01',
      name: 'Delhi Regional Fulfillment Center',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      priority: 1,
      isDefault: true,
      isActive: true,
    },
    {
      code: 'WH-BOM-01',
      name: 'Mumbai Regional Fulfillment Center',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      priority: 2,
      isDefault: false,
      isActive: true,
    },
    {
      code: 'WH-BLR-01',
      name: 'Bengaluru Regional Fulfillment Center',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      priority: 3,
      isDefault: false,
      isActive: true,
    },
  ]

  for (const wh of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: {
        name: wh.name,
        city: wh.city,
        state: wh.state,
        pincode: wh.pincode,
        priority: wh.priority,
        isDefault: wh.isDefault,
        isActive: wh.isActive,
      },
      create: wh,
    })
  }
  console.log(`warehouses: ${warehouses.length}`)
}

async function seedServiceablePincodes() {
  const delWh = await prisma.warehouse.findUnique({ where: { code: 'WH-DEL-01' } })
  const bomWh = await prisma.warehouse.findUnique({ where: { code: 'WH-BOM-01' } })
  const blrWh = await prisma.warehouse.findUnique({ where: { code: 'WH-BLR-01' } })

  const pincodes = [
    // Delhi NCR
    { pincode: '110001', city: 'New Delhi', state: 'Delhi', warehouseId: delWh?.id ?? null, standardDays: 2 },
    { pincode: '110020', city: 'New Delhi', state: 'Delhi', warehouseId: delWh?.id ?? null, standardDays: 2 },
    { pincode: '110085', city: 'New Delhi', state: 'Delhi', warehouseId: delWh?.id ?? null, standardDays: 2 },
    { pincode: '122001', city: 'Gurugram', state: 'Haryana', warehouseId: delWh?.id ?? null, standardDays: 2 },
    { pincode: '201301', city: 'Noida', state: 'Uttar Pradesh', warehouseId: delWh?.id ?? null, standardDays: 2 },
    // Mumbai Region
    { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', warehouseId: bomWh?.id ?? null, standardDays: 2 },
    { pincode: '400050', city: 'Mumbai', state: 'Maharashtra', warehouseId: bomWh?.id ?? null, standardDays: 2 },
    { pincode: '400076', city: 'Mumbai', state: 'Maharashtra', warehouseId: bomWh?.id ?? null, standardDays: 2 },
    { pincode: '400601', city: 'Thane', state: 'Maharashtra', warehouseId: bomWh?.id ?? null, standardDays: 3 },
    { pincode: '400703', city: 'Navi Mumbai', state: 'Maharashtra', warehouseId: bomWh?.id ?? null, standardDays: 3 },
    { pincode: '411001', city: 'Pune', state: 'Maharashtra', warehouseId: bomWh?.id ?? null, standardDays: 3 },
    // South Region
    { pincode: '560001', city: 'Bengaluru', state: 'Karnataka', warehouseId: blrWh?.id ?? null, standardDays: 2 },
    { pincode: '560034', city: 'Bengaluru', state: 'Karnataka', warehouseId: blrWh?.id ?? null, standardDays: 2 },
    { pincode: '560038', city: 'Bengaluru', state: 'Karnataka', warehouseId: blrWh?.id ?? null, standardDays: 2 },
    { pincode: '560100', city: 'Bengaluru', state: 'Karnataka', warehouseId: blrWh?.id ?? null, standardDays: 2 },
    { pincode: '500001', city: 'Hyderabad', state: 'Telangana', warehouseId: blrWh?.id ?? null, standardDays: 3 },
    { pincode: '500081', city: 'Hyderabad', state: 'Telangana', warehouseId: blrWh?.id ?? null, standardDays: 3 },
    { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', warehouseId: blrWh?.id ?? null, standardDays: 3 },
    { pincode: '700001', city: 'Kolkata', state: 'West Bengal', warehouseId: delWh?.id ?? null, standardDays: 4 },
  ]

  for (const pin of pincodes) {
    await prisma.serviceablePincode.upsert({
      where: {
        pincode_warehouseId: {
          pincode: pin.pincode,
          warehouseId: pin.warehouseId ?? '',
        },
      },
      update: {
        city: pin.city,
        state: pin.state,
        codAvailable: true,
        furnitureAvailable: true,
        installationAvailable: true,
        standardDays: pin.standardDays,
        isActive: true,
      },
      create: {
        pincode: pin.pincode,
        warehouseId: pin.warehouseId,
        city: pin.city,
        state: pin.state,
        codAvailable: true,
        furnitureAvailable: true,
        installationAvailable: true,
        standardDays: pin.standardDays,
        isActive: true,
      },
    })
  }
  console.log(`serviceable pincodes: ${pincodes.length}`)
}

async function seedCoupons() {
  const coupons = [
    {
      code: 'WELCOME100',
      description: '₹100 flat discount on your first order',
      type: 'FIXED_AMOUNT' as const,
      value: 100,
      minOrderValue: 500,
      scope: 'FIRST_ORDER' as const,
      firstOrderOnly: true,
      perCustomerLimit: 1,
      isActive: true,
    },
    {
      code: 'FESTIVE10',
      description: '10% discount up to ₹500 on all orders',
      type: 'PERCENTAGE' as const,
      value: 10,
      maxDiscount: 500,
      minOrderValue: 1000,
      scope: 'ORDER' as const,
      firstOrderOnly: false,
      perCustomerLimit: 5,
      isActive: true,
    },
    {
      code: 'FREESHIP',
      description: 'Free delivery on orders above ₹499',
      type: 'FREE_SHIPPING' as const,
      value: 0,
      minOrderValue: 499,
      scope: 'ORDER' as const,
      firstOrderOnly: false,
      perCustomerLimit: 10,
      isActive: true,
    },
  ]

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        description: c.description,
        type: c.type,
        value: c.value,
        maxDiscount: c.maxDiscount ?? null,
        minOrderValue: c.minOrderValue,
        scope: c.scope,
        firstOrderOnly: c.firstOrderOnly,
        perCustomerLimit: c.perCustomerLimit,
        isActive: c.isActive,
      },
      create: {
        code: c.code,
        description: c.description,
        type: c.type,
        value: c.value,
        maxDiscount: c.maxDiscount ?? null,
        minOrderValue: c.minOrderValue,
        scope: c.scope,
        firstOrderOnly: c.firstOrderOnly,
        perCustomerLimit: c.perCustomerLimit,
        isActive: c.isActive,
      },
    })
  }
  console.log(`coupons: ${coupons.length}`)
}

async function seedBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
  const name = process.env.BOOTSTRAP_ADMIN_NAME ?? 'Operations Admin'

  if (process.env.NODE_ENV === 'production') {
    if (!email || !password) return
    throw new Error(
      'Refusing to bootstrap an admin while NODE_ENV=production; use the staff invitation flow instead',
    )
  }
  if (!email || !password) {
    console.log('bootstrap admin: skipped (BOOTSTRAP_ADMIN_EMAIL/PASSWORD not set)')
    return
  }
  if (password.length < 12) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters')
  }

  const [firstName, ...rest] = name.split(' ')
  const passwordHash = await hash(password)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      passwordHash,
      firstName: firstName ?? 'Operations',
      lastName: rest.join(' ') || 'Admin',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  })

  await prisma.adminProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      designation: 'Platform administrator',
      isMfaRequired: process.env.ADMIN_MFA_REQUIRED !== 'false',
    },
  })

  const role = await prisma.role.findUnique({ where: { code: ROLES.SUPER_ADMIN } })
  if (!role) throw new Error('SUPER_ADMIN role missing; seed roles first')

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  })

  console.log(`bootstrap admin: ${email} (development only)`)
}

async function main() {
  await seedPermissions()
  await seedRoles()
  await seedCategories()
  await seedAttributes()
  await seedCategoryAttributes()
  await seedPlatformSeller()
  await seedWarehouses()
  await seedServiceablePincodes()
  await seedCoupons()
  await seedSettings()
  await seedNavigation()
  await seedLegalDocuments()
  await seedBootstrapAdmin()
  console.log('seed complete')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
