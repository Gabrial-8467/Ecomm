'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ZodError } from 'zod'

import type { ActionResult } from '@/lib/admin/action-result'
import { requirePermissionActor, verifyCsrfForCurrentSession } from '@/lib/auth/guards'
import { isAppError } from '@/lib/errors'
import {
  couponInputSchema,
  createCoupon,
  setCouponActive,
} from '@/modules/pricing/coupon.service'

function failure(error: unknown): ActionResult {
  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
    )
    return {
      status: 'error',
      message: 'Please check the highlighted coupon fields.',
      fieldErrors,
    }
  }
  if (isAppError(error)) {
    return { status: 'error', message: error.message }
  }
  console.error('coupon action failed', error)
  return { status: 'error', message: 'Something went wrong. Please try again.' }
}

export async function createCouponAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let createdId: string | null = null
  try {
    const actor = await requirePermissionActor('coupons:write')
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())

    const type = String(formData.get('type') ?? 'PERCENTAGE') as
      | 'PERCENTAGE'
      | 'FIXED_AMOUNT'
      | 'FREE_SHIPPING'

    const parsed = couponInputSchema.parse({
      code: String(formData.get('code') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      type,
      value: formData.get('value') ? String(formData.get('value')) : null,
      maxDiscount: formData.get('maxDiscount') ? String(formData.get('maxDiscount')) : null,
      minOrderValue: formData.get('minOrderValue') ? String(formData.get('minOrderValue')) : null,
      scope: 'ORDER',
      firstOrderOnly: formData.get('firstOrderOnly') === 'true',
      startsAt: formData.get('startsAt') ? String(formData.get('startsAt')) : null,
      endsAt: formData.get('endsAt') ? String(formData.get('endsAt')) : null,
      totalUsageLimit: formData.get('totalUsageLimit') ? Number(formData.get('totalUsageLimit')) : null,
      perCustomerLimit: formData.get('perCustomerLimit') ? Number(formData.get('perCustomerLimit')) : null,
      stackable: false,
      isActive: true,
    })

    const coupon = await createCoupon(parsed, actor.userId)
    createdId = coupon.id

    revalidatePath('/admin/coupons')
  } catch (error) {
    return failure(error)
  }

  if (createdId) {
    redirect('/admin/coupons')
  }

  return { status: 'success', message: 'Coupon created successfully.' }
}

export async function toggleCouponActiveAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requirePermissionActor('coupons:write')
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())

    const couponId = String(formData.get('couponId') ?? '').trim()
    const isActive = formData.get('isActive') === 'true'

    await setCouponActive(couponId, isActive)

    revalidatePath('/admin/coupons')
    return {
      status: 'success',
      message: `Coupon has been ${isActive ? 'activated' : 'deactivated'}.`,
    }
  } catch (error) {
    return failure(error)
  }
}
