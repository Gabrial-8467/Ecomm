import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        This page is not here.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The link may be outdated, or the product may have moved. Try the catalogue or search for
        what you need.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/search">Search products</Link>
        </Button>
      </div>
    </div>
  )
}
