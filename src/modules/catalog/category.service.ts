import 'server-only'

import { AUDIT_EVENTS, audit } from '@/lib/auth/audit'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import type { RequestContext } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { slugify, slugWithSuffix } from '@/lib/slug'
import {
  findCategoryById,
  findCategoryBySlug,
  findCategoryDetail,
  listCategories,
  type CategoryRow,
} from './catalog.repository'
import type { CategoryInput, CategoryUpdateInput } from './catalog.schema'

export interface CategoryTreeNode extends CategoryRow {
  children: CategoryTreeNode[]
}

export function buildCategoryTree(rows: CategoryRow[]): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>()
  for (const row of rows) byId.set(row.id, { ...row, children: [] })

  const roots: CategoryTreeNode[] = []
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sort = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    for (const node of nodes) sort(node.children)
  }
  sort(roots)
  return roots
}

export async function getCategoryTree(options: { activeOnly?: boolean } = {}) {
  const rows = await listCategories(false)
  const filtered = options.activeOnly ? rows.filter((row) => row.isActive && !row.archivedAt) : rows
  return buildCategoryTree(filtered)
}

export async function getCategoryBySlug(slug: string) {
  const category = await findCategoryBySlug(slug)
  if (!category || category.archivedAt) throw new NotFoundError('Category not found.')
  return category
}

export async function getCategoryDetail(id: string) {
  const category = await findCategoryDetail(id)
  if (!category) throw new NotFoundError('Category not found.')
  return category
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base, 'category')
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = slugWithSuffix(root, attempt)
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing || existing.id === excludeId) return candidate
  }
  throw new ConflictError('Could not allocate a unique category slug.')
}

async function assertExplicitSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } })
  if (existing && existing.id !== excludeId) {
    throw new ConflictError('A category with this slug already exists.')
  }
}

export async function createCategory(
  input: CategoryInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const parent = input.parentId
    ? await prisma.category.findUnique({ where: { id: input.parentId } })
    : null
  if (input.parentId && !parent) throw new ValidationError('Parent category not found.')

  const slug = input.slug ?? (await ensureUniqueSlug(input.name))
  if (input.slug) await assertExplicitSlugAvailable(input.slug)

  const path = parent ? `${parent.path}/${slug}` : `/${slug}`
  const duplicatePath = await prisma.category.findUnique({ where: { path }, select: { id: true } })
  if (duplicatePath) throw new ConflictError('A category already uses this path.')

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      parentId: parent?.id ?? null,
      path,
      level: parent ? parent.level + 1 : 0,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      icon: input.icon ?? null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      returnWindowDays: input.returnWindowDays,
      isReturnable: input.isReturnable,
      replacementAllowed: input.replacementAllowed,
      warrantyMonths: input.warrantyMonths ?? null,
      shippingClass: input.shippingClass,
    },
  })

  await audit({
    action: AUDIT_EVENTS.catalogCategoryCreated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Category',
    entityId: category.id,
    after: { name: category.name, path: category.path },
    ...context,
  })

  return category
}

export async function updateCategory(
  id: string,
  input: CategoryUpdateInput,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Category not found.')

  const nextParentId =
    input.parentId !== undefined ? (input.parentId ?? null) : existing.parentId
  const nextSlug = input.slug ?? existing.slug

  if (nextSlug !== existing.slug) await assertExplicitSlugAvailable(nextSlug, id)

  if (nextParentId === id) {
    throw new ValidationError('A category cannot be its own parent.')
  }

  const parent = nextParentId
    ? await prisma.category.findUnique({ where: { id: nextParentId } })
    : null
  if (nextParentId && !parent) throw new ValidationError('Parent category not found.')
  if (parent && (parent.path === existing.path || parent.path.startsWith(`${existing.path}/`))) {
    throw new ValidationError('A category cannot be moved under one of its descendants.')
  }

  const nextPath = parent ? `${parent.path}/${nextSlug}` : `/${nextSlug}`
  const nextLevel = parent ? parent.level + 1 : 0

  await prisma.$transaction(async (tx) => {
    const subtree = await tx.category.findMany({
      where: { OR: [{ id }, { path: { startsWith: `${existing.path}/` } }] },
      orderBy: { level: 'asc' },
    })

    const updates = subtree.map((row) => {
      if (row.id === id) {
        return { id: row.id, path: nextPath, level: nextLevel }
      }
      return {
        id: row.id,
        path: `${nextPath}${row.path.slice(existing.path.length)}`,
        level: nextLevel + (row.level - existing.level),
      }
    })

    const subtreeIds = updates.map((entry) => entry.id)
    const collision = await tx.category.findFirst({
      where: {
        path: { in: updates.map((entry) => entry.path) },
        id: { notIn: subtreeIds },
      },
      select: { id: true },
    })
    if (collision) throw new ConflictError('The new category path collides with another category.')

    await tx.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        slug: nextSlug,
        parentId: nextParentId,
        path: nextPath,
        level: nextLevel,
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        ...(input.returnWindowDays !== undefined
          ? { returnWindowDays: input.returnWindowDays }
          : {}),
        ...(input.isReturnable !== undefined ? { isReturnable: input.isReturnable } : {}),
        ...(input.replacementAllowed !== undefined
          ? { replacementAllowed: input.replacementAllowed }
          : {}),
        ...(input.warrantyMonths !== undefined ? { warrantyMonths: input.warrantyMonths } : {}),
        ...(input.shippingClass !== undefined ? { shippingClass: input.shippingClass } : {}),
      },
    })

    // Descendant paths are updated after the node itself. None of the new
    // paths collide with the current subtree because they are all prefixed
    // by `nextPath`.
    for (const update of updates) {
      if (update.id === id) continue
      await tx.category.update({
        where: { id: update.id },
        data: { path: update.path, level: update.level },
      })
    }
  })

  await audit({
    action: AUDIT_EVENTS.catalogCategoryUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Category',
    entityId: id,
    before: { name: existing.name, path: existing.path, parentId: existing.parentId },
    after: { name: input.name ?? existing.name, path: nextPath, parentId: nextParentId },
    ...context,
  })

  return getCategoryDetail(id)
}

export async function deleteCategory(
  id: string,
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { children: true, products: true } } },
  })
  if (!category) throw new NotFoundError('Category not found.')
  if (category._count.children > 0 || category._count.products > 0) {
    throw new ConflictError(
      'Move or delete child categories and reassign products before deleting this category.',
    )
  }

  await prisma.category.delete({ where: { id } })

  await audit({
    action: AUDIT_EVENTS.catalogCategoryDeleted,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Category',
    entityId: id,
    before: { name: category.name, path: category.path },
    ...context,
  })
}

export async function setCategoryAttributes(
  categoryId: string,
  assignments: {
    attributeId: string
    isRequired: boolean
    isFilterable: boolean
    sortOrder: number
  }[],
  actorId: string,
  context: RequestContext = { ip: null, userAgent: null, requestId: null },
) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) throw new NotFoundError('Category not found.')

  const attributeIds = [...new Set(assignments.map((entry) => entry.attributeId))]
  const existing = await prisma.attributeDefinition.findMany({
    where: { id: { in: attributeIds } },
    select: { id: true },
  })
  if (existing.length !== attributeIds.length) {
    throw new ValidationError('One or more attributes do not exist.')
  }

  await prisma.$transaction(async (tx) => {
    await tx.categoryAttribute.deleteMany({ where: { categoryId } })
    if (assignments.length > 0) {
      await tx.categoryAttribute.createMany({
        data: assignments.map((entry) => ({
          categoryId,
          attributeId: entry.attributeId,
          isRequired: entry.isRequired,
          isFilterable: entry.isFilterable,
          sortOrder: entry.sortOrder,
        })),
      })
    }
  })

  await audit({
    action: AUDIT_EVENTS.catalogCategoryUpdated,
    actorId,
    actorType: 'ADMIN',
    entityType: 'Category',
    entityId: categoryId,
    after: { attributeIds },
    ...context,
  })

  return getCategoryDetail(categoryId)
}
