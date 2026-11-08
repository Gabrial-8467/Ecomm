'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import type { ActionResult } from '@/lib/admin/action-result'

import { toggleCouponActiveAction } from './actions'

export function ToggleCouponButton({
  couponId,
  isActive,
  csrfToken,
}: {
  couponId: string
  isActive: boolean
  csrfToken: string
}) {
  const [_state, formAction, pending] = useActionState(toggleCouponActiveAction, {
    status: 'idle',
  } as ActionResult)

  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="couponId" value={couponId} />
      <input type="hidden" name="isActive" value={isActive ? 'false' : 'true'} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="h-7 text-[11px]"
      >
        {pending ? 'Updating…' : isActive ? 'Deactivate' : 'Activate'}
      </Button>
    </form>
  )
}
