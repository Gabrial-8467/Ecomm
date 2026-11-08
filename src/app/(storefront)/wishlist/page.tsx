import type { Metadata } from 'next'
import { ArrowRight, Heart, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { WishlistLineControls } from '@/components/store/wishlist-line-controls'
import { Button } from '@/components/ui/button'
import { getWishlistView } from '@/modules/wishlist/wishlist.service'

export const metadata: Metadata = {
  title: 'Your wishlist',
  description: 'Products you have saved on CasaCircuit.',
  robots: { index: false, follow: true },
}

export const dynamic = 'force-dynamic'

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default async function WishlistPage() {
  const wishlist = await getWishlistView()

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Wishlist</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your wishlist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {wishlist.items.length === 0
            ? 'Nothing saved yet.'
            : `${wishlist.items.length} saved product${wishlist.items.length === 1 ? '' : 's'}.`}
        </p>
      </header>

      {wishlist.items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <Heart className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl font-semibold">Your wishlist is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Tap the heart on a product to save it. Your wishlist works without an account and is
            kept on this device for later.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/products">
                Browse products
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/categories">Shop by category</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {wishlist.items.map((item) => (
              <li key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-secondary"
                >
                  {item.image ? (
                    <Image
                      src={item.image.url}
                      alt={item.image.alt}
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <ImageIcon className="size-6" aria-hidden="true" />
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-medium">
                    <Link href={`/products/${item.productSlug}`} className="hover:text-accent">
                      {item.productName}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {item.price === null ? 'Price unavailable' : money.format(item.price)}
                  </p>
                  {!item.available ? (
                    <p className="mt-1 text-xs text-muted-foreground">Currently unavailable</p>
                  ) : null}
                  <div className="mt-3">
                    <WishlistLineControls itemId={item.id} available={item.available} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs leading-6 text-muted-foreground">
            {wishlist.isGuest
              ? 'This wishlist is saved on this device. Sign in later and it will move to your account.'
              : 'This wishlist is saved to your account and follows you across devices.'}
          </p>
        </>
      )}
    </div>
  )
}
