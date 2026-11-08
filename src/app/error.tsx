'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The server logs the original error; the client is intentionally terse.
    console.error('Unhandled UI error', error.digest)
  }, [error])

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
        Something broke
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        We could not load this page.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Please try again. If the problem persists, contact customer care with the reference below.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      ) : null}
      <Button className="mt-7" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
