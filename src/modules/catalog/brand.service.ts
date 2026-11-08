import 'server-only'

import { AUDIT_EVENTS, audit } from '@/lib/auth/audit'
import { ConflictError, NotFoundError } from '@/lib/errors'
import type { RequestContext } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { slugify, slugWithSuffix } from '@/lib/slug'
import { findBrandById, findBrandBySlug, listBrands } from './catalog.repository'
import type { BrandInput, BrandUpdateInput } from './catalog.schema'

export async function getBrands(options: { includeInactive?: boolean; featuredOnly?: boolean } = {}) {
  const rows = await listBrands(options.includeInactive)
  return options.featuredOnly ? rows.filter((brand) => brand.isFeatured) : rows
}

export async function getBrand(id: string) {
  const brand = await findBrandById(id)
  if (!brand) throw new NotFoundError('Brand not found.')
  return brand
}

export async function getBrandBySlug(slug: string) {
  const brand = await findBrandBySlug(slug)
  if (!brand) throw new NotFoundError('Brand not found.')
  return brand
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base, 'brand')
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = slugWithSuffix(root, attempt)
    const existing = await prisma.brand.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing || existing.id === excludeId) return candidate
  }
  throw new ConflictError('Could not allocate a unique brand slug.')
}

export async function createBrand(
  input: BrandInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const slug = input.slug ?? (await ensureUniqueSlug(input.name))
  if (input.slug) {
    const existing = await prisma.brand.findUnique({ where: { slug }, select: { id: true } })
    if (existing) throw new ConflictError('A brand with this slug already exists.')
  }

  const brand = await prisma.brand.create({
    data: {
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
      description: input.description ?? null,
      isFeatured: input.isFeatured,
      isActive: input.isActive,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    },
  })

  await audit({
    action: AUDIT_EVENTS.catalogBrandCreated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Brand',
    entityId: brand.id,
    after: { name: brand.name, slug: brand.slug },
    ...context,
  })
  return brand
}

export async function updateBrand(
  id: string,
  input: BrandUpdateInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const existing = await prisma.brand.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Brand not found.')

  if (input.slug && input.slug !== existing.slug) {
    const duplicate = await prisma.brand.findUnique({ where: { slug: input.slug }, select: { id: true } })
    if (duplicate) throw new ConflictError('A brand with this slug already exists.')
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
    },
  })

  await audit({
    action: AUDIT_EVENTS.catalogBrandUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Brand',
    entityId: id,
    before: { name: existing.name, slug: existing.slug },
    after: { name: brand.name, slug: brand.slug },
    ...context,
  })
  return brand
}

export async function deleteBrand(
  id: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!brand) throw new NotFoundError('Brand not found.')
  if (brand._count.products > 0) {
    throw new ConflictError('Reassign or archive the brand’s products before deleting it.')
  }

  await prisma.brand.delete({ where: { id } })
  await audit({
    action: AUDIT_EVENTS.catalogBrandDeleted,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Brand',
    entityId: id,
    before: { name: brand.name, slug: brand.slug },
    ...context,
  })
}
