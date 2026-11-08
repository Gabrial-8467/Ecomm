import 'server-only'

import { cache } from 'react'
import { revalidatePath } from 'next/cache'

import { getCurrentActor } from '@/lib/auth/guards'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { ensureGuestTokenHash, readGuestTokenHash } from '@/lib/guest-identity'
import { prisma } from '@/lib/prisma'
import { addCartItem } from '@/modules/cart/cart.service'

const wishlistInclude = {
  items: {
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          archivedAt: true,
          category: { select: { isActive: true, archivedAt: true } },
          images: {
            where: { isPrimary: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
            select: { url: true, alt: true },
          },
          variants: {
            where: { isActive: true },
            orderBy: { price: 'asc' },
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              inventory: { select: { onHand: true, reserved: true, damaged: true } },
            },
          },
        },
      },
    },
  },
} satisfies import('@/generated/prisma/client').Prisma.WishlistInclude

type WishlistWithItems = import('@/generated/prisma/client').Prisma.WishlistGetPayload<{
  include: typeof wishlistInclude
}>

type WishlistProduct = NonNullable<WishlistWithItems['items'][number]['product']>
type WishlistProductVariant = WishlistProduct['variants'][number]

interface Owner {
  userId: string | null
  guestTokenHash: string | null
}

export interface WishlistLine {
  id: string
  productId: string
  productName: string
  productSlug: string
  image: { url: string; alt: string } | null
  price: number | null
  defaultVariantId: string | null
  available: boolean
  createdAt: string
}

export interface WishlistView {
  id: string | null
  items: WishlistLine[]
  isGuest: boolean
}

function stockFor(variant: WishlistProductVariant) {
  return variant.inventory.reduce(
    (total, row) => total + Math.max(0, row.onHand - row.reserved - row.damaged),
    0,
  )
}

function isPublished(product: WishlistProduct): boolean {
  return (
    product.status === 'ACTIVE' &&
    product.archivedAt === null &&
    product.category.isActive &&
    product.category.archivedAt === null
  )
}

function buildView(wishlist: WishlistWithItems, isGuest: boolean): WishlistView {
  return {
    id: wishlist.id,
    isGuest,
    items: wishlist.items.flatMap((item) => {
      const product = item.product
      if (!product) return []
      const published = isPublished(product)
      const inStock = product.variants.find((variant) => stockFor(variant) > 0) ?? null
      const cheapest = inStock ?? product.variants[0] ?? null
      const image = product.images[0] ?? null
      return [
        {
          id: item.id,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          image: image ? { url: image.url, alt: image.alt } : null,
          price: cheapest ? Number(cheapest.price.toString()) : null,
          defaultVariantId: cheapest?.id ?? null,
          available: published && inStock !== null,
          createdAt: item.createdAt.toISOString(),
        },
      ]
    }),
  }
}

async function resolveOwner(): Promise<Owner> {
  const actor = await getCurrentActor()
  if (actor) return { userId: actor.userId, guestTokenHash: null }
  return { userId: null, guestTokenHash: await readGuestTokenHash() }
}

async function ensureOwner(): Promise<Owner> {
  const actor = await getCurrentActor()
  if (actor) return { userId: actor.userId, guestTokenHash: null }
  return { userId: null, guestTokenHash: await ensureGuestTokenHash() }
}

function wishlistWhere(owner: Owner) {
  return owner.userId ? { userId: owner.userId } : { guestTokenHash: owner.guestTokenHash }
}

async function findWishlist(owner: Owner): Promise<WishlistWithItems | null> {
  if (!owner.userId && !owner.guestTokenHash) return null
  return prisma.wishlist.findFirst({
    where: wishlistWhere(owner),
    include: wishlistInclude,
  })
}

async function ensureWishlist(owner: Owner): Promise<WishlistWithItems> {
  const existing = await findWishlist(owner)
  if (existing) return existing
  return prisma.wishlist.create({
    data: {
      userId: owner.userId,
      guestTokenHash: owner.userId ? null : owner.guestTokenHash,
    },
    include: wishlistInclude,
  })
}

export const getWishlistView = cache(async (): Promise<WishlistView> => {
  const owner = await resolveOwner()
  const wishlist = await findWishlist(owner)
  if (!wishlist) return { id: null, items: [], isGuest: owner.userId === null }
  return buildView(wishlist, owner.userId === null)
})

export const getWishlistCount = cache(async (): Promise<number> => {
  const owner = await resolveOwner()
  if (!owner.userId && !owner.guestTokenHash) return 0
  return prisma.wishlistItem.count({ where: { wishlist: wishlistWhere(owner) } })
})

/** Product ids saved by the current visitor, for rendering toggle state. */
export const getWishlistProductIds = cache(async (): Promise<Set<string>> => {
  const owner = await resolveOwner()
  if (!owner.userId && !owner.guestTokenHash) return new Set()
  const rows = await prisma.wishlistItem.findMany({
    where: { wishlist: wishlistWhere(owner), productId: { not: null } },
    select: { productId: true },
  })
  return new Set(rows.map((row) => row.productId).filter((id): id is string => id !== null))
})

export async function addWishlistProduct(
  productId: string,
): Promise<{ saved: boolean; message: string }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      status: true,
      archivedAt: true,
      category: { select: { isActive: true, archivedAt: true } },
    },
  })
  if (
    !product ||
    product.status !== 'ACTIVE' ||
    product.archivedAt !== null ||
    !product.category.isActive ||
    product.category.archivedAt !== null
  ) {
    throw new ValidationError('That product is not currently available.')
  }

  const owner = await ensureOwner()
  const wishlist = await ensureWishlist(owner)
  const existing = wishlist.items.find((item) => item.productId === productId)
  if (existing) {
    return { saved: true, message: `${product.name} is already in your wishlist.` }
  }

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId, variantId: null },
  })
  revalidatePath('/wishlist')
  revalidatePath('/products')
  revalidatePath('/products/[slug]', 'page')
  return { saved: true, message: `${product.name} saved to your wishlist.` }
}

export async function removeWishlistProduct(
  productId: string,
): Promise<{ saved: boolean; message: string }> {
  const owner = await ensureOwner()
  const wishlist = await findWishlist(owner)
  if (!wishlist) return { saved: false, message: 'That product is not in your wishlist.' }
  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, productId, variantId: null },
  })
  revalidatePath('/wishlist')
  revalidatePath('/products')
  revalidatePath('/products/[slug]', 'page')
  return { saved: false, message: 'Removed from your wishlist.' }
}

export async function toggleWishlistProduct(
  productId: string,
): Promise<{ saved: boolean; message: string }> {
  const owner = await ensureOwner()
  const wishlist = await ensureWishlist(owner)
  const existing = wishlist.items.find((item) => item.productId === productId)
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
    revalidatePath('/wishlist')
    revalidatePath('/products')
    revalidatePath('/products/[slug]', 'page')
    return { saved: false, message: 'Removed from your wishlist.' }
  }
  return addWishlistProduct(productId)
}

export async function removeWishlistItem(itemId: string): Promise<string> {
  const owner = await ensureOwner()
  const wishlist = await findWishlist(owner)
  if (!wishlist) throw new NotFoundError('Your wishlist is empty.')
  const item = wishlist.items.find((entry) => entry.id === itemId)
  if (!item) throw new NotFoundError('That wishlist item could not be found.')
  await prisma.wishlistItem.delete({ where: { id: item.id } })
  revalidatePath('/wishlist')
  return 'Removed from your wishlist.'
}

export async function moveWishlistItemToCart(itemId: string): Promise<{ message: string }> {
  const owner = await ensureOwner()
  const wishlist = await findWishlist(owner)
  if (!wishlist) throw new NotFoundError('Your wishlist is empty.')
  const item = wishlist.items.find((entry) => entry.id === itemId)
  if (!item) throw new NotFoundError('That wishlist item could not be found.')
  const product = item.product
  if (!product || !isPublished(product)) {
    throw new ValidationError('That product is no longer available.')
  }
  const variant = product.variants.find((option) => stockFor(option) > 0)
  if (!variant) throw new ValidationError('That product is currently out of stock.')
  return addCartItem(variant.id, 1)
}

/** Merge guest wishlist items into the signed-in customer's wishlist after login. */
export async function mergeGuestWishlistIntoUser(userId: string): Promise<void> {
  const guestTokenHash = await readGuestTokenHash()
  if (!guestTokenHash) return

  const guestWishlist = await prisma.wishlist.findFirst({
    where: { guestTokenHash },
    include: { items: true },
  })
  if (!guestWishlist || guestWishlist.items.length === 0) return

  const userWishlist =
    (await prisma.wishlist.findUnique({ where: { userId }, include: { items: true } })) ??
    (await prisma.wishlist.create({ data: { userId }, include: { items: true } }))

  const existingProductIds = new Set(
    userWishlist.items.map((item) => item.productId).filter((id): id is string => id !== null),
  )

  for (const item of guestWishlist.items) {
    if (item.productId && !existingProductIds.has(item.productId)) {
      await prisma.wishlistItem.create({
        data: { wishlistId: userWishlist.id, productId: item.productId, variantId: null },
      })
    }
  }

  await prisma.wishlist.delete({ where: { id: guestWishlist.id } })
}
