import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import Link from 'next/link'

import { getEnv } from '@/lib/env'
import { getCartCount } from '@/modules/cart/cart.service'
import { getWishlistCount } from '@/modules/wishlist/wishlist.service'

const PRIMARY_LINKS = [
  { href: '/categories/furniture', label: 'Furniture' },
  { href: '/categories/electronics', label: 'Electronics' },
  { href: '/products?sort=newest', label: 'New arrivals' },
  { href: '/products?sort=discount', label: 'Deals' },
]

function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="CasaCircuit home">
      <span className="relative grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none">
          <path
            d="M5 10.5V6.8c0-.9.7-1.6 1.6-1.6h10.8c.9 0 1.6.7 1.6 1.6v3.7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M4.2 13.2c0-.8.6-1.4 1.4-1.4h12.8c.8 0 1.4.6 1.4 1.4v3.3H4.2v-3.3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M6 16.5v2.2M18 16.5v2.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="9" r="1.15" fill="currentColor" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold tracking-tight">CasaCircuit</span>
        <span className="mt-0.5 text-[0.625rem] tracking-[0.18em] text-muted-foreground uppercase">
          Furniture · Electronics
        </span>
      </span>
    </Link>
  )
}

export async function SiteHeader() {
  const env = getEnv()
  const [cartCount, wishlistCount] = await Promise.all([
    getCartCount().catch(() => 0),
    getWishlistCount().catch(() => 0),
  ])
  const freeShipping = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(env.FREE_SHIPPING_THRESHOLD)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="bg-primary px-4 py-2 text-center text-xs text-primary-foreground">
        <p>
          Free standard delivery above {freeShipping} on serviceable pincodes · GST invoice with
          every order
        </p>
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <form
          action="/search"
          role="search"
          className="hidden min-w-0 flex-1 justify-center md:flex"
        >
          <div className="relative w-full max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search sofas, televisions, appliances…"
              autoComplete="off"
              className="h-10 w-full rounded-full border border-input bg-card pr-4 pl-9 text-sm shadow-sm transition outline-none focus:border-accent focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/account"
            className="hidden rounded-md p-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
            aria-label="Account"
          >
            <UserRound className="size-5" aria-hidden="true" />
          </Link>
          <Link
            href="/wishlist"
            className="relative hidden rounded-md p-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
            aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} saved` : 'Wishlist'}
          >
            <Heart className="size-5" aria-hidden="true" />
            {wishlistCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.625rem] leading-4 font-semibold text-accent-foreground">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-md p-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            <span className="hidden text-sm font-medium lg:inline">Cart</span>
            {cartCount > 0 ? (
              <span className="absolute -top-0.5 right-0 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.625rem] leading-4 font-semibold text-accent-foreground lg:static">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            ) : null}
          </Link>

          <details className="group relative lg:hidden">
            <summary
              className="inline-flex cursor-pointer list-none rounded-md p-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5 group-open:hidden" aria-hidden="true" />
              <X className="hidden size-5 group-open:block" aria-hidden="true" />
            </summary>
            <div className="absolute top-12 right-0 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-xl">
              <form action="/search" role="search" className="mb-3">
                <label htmlFor="mobile-search" className="sr-only">
                  Search products
                </label>
                <input
                  id="mobile-search"
                  name="q"
                  type="search"
                  placeholder="Search products"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </form>
              <nav aria-label="Mobile" className="grid">
                {PRIMARY_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-2 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 border-border" />
                <Link href="/account" className="rounded-md px-2 py-2.5 text-sm hover:bg-secondary">
                  My account
                </Link>
                <Link
                  href="/wishlist"
                  className="rounded-md px-2 py-2.5 text-sm hover:bg-secondary"
                >
                  Wishlist
                </Link>
                <Link href="/orders" className="rounded-md px-2 py-2.5 text-sm hover:bg-secondary">
                  Track order
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
