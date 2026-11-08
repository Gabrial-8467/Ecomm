'use client'

import { Heart } from 'lucide-react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { toggleWishlistAction, type WishlistActionState } from '@/app/(storefront)/wishlist-actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const initialState: WishlistActionState = { status: 'idle' }

function Submit({
  saved,
  iconOnly,
  label,
  fullWidth,
}: {
  saved: boolean
  iconOnly: boolean
  label: string
  fullWidth: boolean
}) {
  const { pending } = useFormStatus()

  if (iconOnly) {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-label={label}
        title={label}
        aria-pressed={saved}
        className={cn(
          'grid size-9 place-items-center rounded-full border border-border bg-card/95 shadow-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-60',
          saved && 'border-accent text-accent',
        )}
      >
        <Heart className={cn('size-4', saved && 'fill-current')} aria-hidden="true" />
      </button>
    )
  }

  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      disabled={pending}
      aria-pressed={saved}
      className={cn(fullWidth && 'w-full')}
    >
      <Heart className={cn('size-4', saved && 'fill-current text-accent')} aria-hidden="true" />
      {pending ? 'Saving…' : saved ? 'Saved to wishlist' : label}
    </Button>
  )
}

export function WishlistButton({
  productId,
  saved = false,
  iconOnly = false,
  fullWidth = false,
  className,
}: {
  productId: string
  saved?: boolean
  iconOnly?: boolean
  fullWidth?: boolean
  className?: string
}) {
  const [state, formAction] = useActionState(toggleWishlistAction, initialState)
  const isSaved = state.saved ?? saved
  const label = isSaved ? 'Remove from wishlist' : 'Save to wishlist'

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="productId" value={productId} />
      <Submit saved={isSaved} iconOnly={iconOnly} label={label} fullWidth={fullWidth} />
      {state.status === 'error' ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
