'use server'

import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'

import type { ActionResult } from '@/lib/admin/action-result'
import { requirePermissionActor, verifyCsrfForCurrentSession } from '@/lib/auth/guards'
import { isAppError } from '@/lib/errors'
import { reviewReturnRequest, reviewReturnSchema } from '@/modules/orders/return.service'

function failure(error: unknown): ActionResult {
  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
    )
    return {
      status: 'error',
      message: 'Please check the highlighted return fields.',
      fieldErrors,
    }
  }
  if (isAppError(error)) {
    return { status: 'error', message: error.message }
  }
  console.error('return review action failed', error)
  return { status: 'error', message: 'Something went wrong. Please try again.' }
}

export async function reviewReturnAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requirePermissionActor('returns:approve')
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())

    const returnId = String(formData.get('returnId') ?? '').trim()
    const action = String(formData.get('action') ?? '').trim() as 'APPROVE' | 'REJECT'
    const rejectionReason = String(formData.get('rejectionReason') ?? '').trim() || undefined
    const inspectionNotes = String(formData.get('inspectionNotes') ?? '').trim() || undefined
    const restockWarehouseId = String(formData.get('restockWarehouseId') ?? '').trim() || undefined

    const parsed = reviewReturnSchema.parse({
      returnId,
      action,
      rejectionReason,
      inspectionNotes,
      actorUserId: actor.userId,
      restockWarehouseId,
    })

    const result = await reviewReturnRequest(parsed)

    revalidatePath('/admin/returns')
    revalidatePath(`/admin/returns/${returnId}`)
    revalidatePath('/admin/orders')
    revalidatePath('/admin/inventory')

    return {
      status: 'success',
      message: `Return request ${result.status === 'APPROVED' ? 'approved and refund queued' : 'rejected'}.`,
    }
  } catch (error) {
    return failure(error)
  }
}
