import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'

import { NewsletterForm } from '@/components/marketing/newsletter-form'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  {
    href: '/furniture/sofas-seating',
    title: 'Sofas & seating',
    description: 'Deep seats, honest foam densities and fabrics that survive real life.',
    gradient: 'from-[#d9c3a5] via-[#c2a27f] to-[#8c6a4a]',
  },
  {
    href: '/furniture/beds-mattresses',
    title: 'Beds & mattresses',
    description: 'Storage beds, solid-wood frames and mattresses with stated firmness.',
    gradient: 'from-[#cfd3c6] via-[#aeb7a4] to-[#7a8873]',
  },
  {
    href: '/electronics/televisions',
    title: 'Televisions',
    description: 'Panel types, refresh rates and ports documented before you buy.',
    gradient: 'from-[#b9c3cf] via-[#8d9cae] to-[#536578]',
  },
  {
    href: '/electronics/home-appliances',
    title: 'Home appliances',
    description: 'Cooling, laundry and air care with energy ratings made explicit.',
    gradient: 'from-[#e3d6c4] via-[#cbb59a] to-[#9c7d5c]',
  },
  {
    href: '/furniture/tables-desks',
    title: 'Tables & desks',
    description: 'Dining, study and work tables measured to the centimetre.',
    gradient: 'from-[#d6c8b8] via-[#b8a48d] to-[#836d56]',
  },
  {
    href: '/electronics/audio',
    title: 'Audio',
    description: 'Speakers and headphones with connectivity and codec support listed.',
    gradient: 'from-[#c9c2d6] via-[#a49ab8] to-[#6c6284]',
  },
]

const SERVICES = [
  {
    icon: Truck,
    title: 'Pincode-first delivery',
    body: 'Serviceability and delivery windows are confirmed against your address before payment.',
  },
  {
    icon: Wrench,
    title: 'Installation where needed',
    body: 'Furniture and large appliances can include scheduled installation in supported cities.',
  },
  {
    icon: RotateCcw,
    title: 'Returns with a paper trail',
    body: 'Every request, inspection and refund is tracked against the order and policy version.',
  },
  {
    icon: ShieldCheck,
    title: 'Warranty terms in writing',
    body: 'Manufacturer or seller warranty duration is shown on the product page and invoice.',
  },
]

const PRINCIPLES = [
  {
    icon: Ruler,
    title: 'Dimensions before adjectives',
    body: 'Every furniture listing carries width, depth, height, material and finish — not just styling language.',
  },
  {
    icon: ClipboardCheck,
    title: 'Prices that explain themselves',
    body: 'Tax-inclusive prices, itemised GST invoices and price history that respects prior-price rules.',
  },
  {
    icon: Boxes,
    title: 'Stock you can rely on',
    body: 'Inventory is reserved atomically at checkout so an order is never confirmed against stock that is gone.',
  },
  {
    icon: BadgeCheck,
    title: 'Reviews from real orders',
    body: 'Only verified buyers can review, and sponsored placements are labelled as sponsored.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_85%_10%,oklch(0.9_0.05_75)_0%,transparent_55%),radial-gradient(90%_90%_at_10%_100%,oklch(0.94_0.03_150)_0%,transparent_60%)]"
        />
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Furniture & electronics, considered
            </p>
            <h1 className="mt-6 max-w-2xl font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              A calmer way to furnish and power your home.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              CasaCircuit is built around the details that decide whether a purchase works out:
              measured dimensions, documented materials, honest stock and a delivery promise tied to
              your pincode.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/furniture">
                  Shop furniture
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/electronics">Shop electronics</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" aria-hidden="true" />
                GST-inclusive prices
              </li>
              <li className="flex items-center gap-2">
                <Truck className="size-4 text-success" aria-hidden="true" />
                Pincode-based delivery
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-success" aria-hidden="true" />
                Verified-purchase reviews
              </li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-primary/10">
              <div className="absolute inset-0 bg-[linear-gradient(160deg,#efe7da_0%,#e3d5c1_45%,#c9b69c_100%)]" />
              <div
                aria-hidden="true"
                className="absolute top-[16%] left-1/2 h-[46%] w-[62%] -translate-x-1/2 rounded-t-[45%] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(238,227,211,0.55))] shadow-inner"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 h-[34%] w-[86%] -translate-x-1/2 rounded-t-3xl bg-[linear-gradient(180deg,#8d6b4f,#6a4d37)] shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-[30%] left-1/2 h-[13%] w-[70%] -translate-x-1/2 rounded-2xl bg-[linear-gradient(180deg,#b48f6d,#8d6b4f)]"
              />
              <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                <span className="rounded-full bg-background/80 px-3 py-1 text-[0.625rem] font-semibold tracking-[0.14em] text-foreground uppercase backdrop-blur">
                  The considered edit
                </span>
                <span className="rounded-full bg-primary px-3 py-1 text-[0.625rem] font-semibold tracking-[0.14em] text-primary-foreground uppercase">
                  New
                </span>
              </div>
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/40 bg-background/90 p-4 backdrop-blur">
                <p className="font-display text-lg leading-snug font-semibold">
                  Start with the room, not the algorithm.
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Browse by room and compare materials, dimensions and warranty before you commit.
                </p>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-lg sm:block">
              <p className="text-[0.625rem] tracking-[0.14em] text-muted-foreground uppercase">
                Every order
              </p>
              <p className="mt-0.5 text-sm font-semibold">Itemised GST invoice</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20" aria-labelledby="category-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
              Browse the edit
            </p>
            <h2
              id="category-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Rooms, systems and the things between
            </h2>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent"
          >
            All categories
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <li key={category.href}>
              <Link
                href={category.href}
                className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl border border-border p-6 text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`}
                  aria-hidden="true"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(20,15,10,0.55)_100%)]"
                />
                <div className="relative">
                  <h3 className="font-display text-2xl font-semibold">{category.title}</h3>
                  <p className="mt-1.5 max-w-xs text-sm leading-6 text-white/85">
                    {category.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                    Explore
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="border-y border-border bg-secondary/40 py-16 lg:py-20"
        aria-labelledby="service-heading"
      >
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
              After you click buy
            </p>
            <h2
              id="service-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              The boring parts, done properly
            </h2>
            <p className="mt-4 text-muted-foreground">
              Delivery, installation and returns are where furniture and electronics purchases
              usually fall apart. We treat them as product features, not footnotes.
            </p>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <li key={service.title} className="rounded-xl border border-border bg-card p-5">
                <service.icon className="size-6 text-accent" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-16 lg:py-24" aria-labelledby="principles-heading">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
              Why this exists
            </p>
            <h2
              id="principles-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Less theatre. More specification.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-muted-foreground">
              A furniture or television purchase is a long-term decision. The storefront should give
              you enough information to make it without a sales call, and enough recourse if
              something goes wrong.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link href="/about">
                How we work
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <li key={principle.title} className="rounded-xl border border-border bg-card p-5">
                <principle.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold">{principle.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page pb-20" aria-labelledby="newsletter-heading">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-primary px-6 py-12 text-primary-foreground sm:px-10 lg:px-14">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-20 size-72 rounded-full border border-primary-foreground/15"
          />
          <div
            aria-hidden="true"
            className="absolute right-24 -bottom-28 size-56 rounded-full border border-primary-foreground/10"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-primary-foreground/70 uppercase">
                The CasaCircuit edit
              </p>
              <h2
                id="newsletter-heading"
                className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                New arrivals, price changes and useful buying notes.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">
                Occasional email, no daily noise. Unsubscribe in one click. We never sell your email
                address.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  )
}
