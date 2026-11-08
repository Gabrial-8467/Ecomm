'use server'

import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'

import type { ActionResult } from '@/lib/admin/action-result'
import { requirePermissionActor, verifyCsrfForCurrentSession } from '@/lib/auth/guards'
import { isAppError } from '@/lib/errors'
import { adjustStock, stockAdjustmentSchema } from '@/modules/inventory/inventory.service'

function failure(error: unknown): ActionResult {
  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
    )
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors,
    }
  }
  if (isAppError(error)) {
    return { status: 'error', message: error.message }
  }
  console.error('inventory adjustment action failed', error)
  return { status: 'error', message: 'Something went wrong. Please try again.' }
}

export async function adjustStockAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requirePermissionActor('inventory:adjust')
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())

    const variantId = String(formData.get('variantId') ?? '').trim()
    const warehouseId = String(formData.get('warehouseId') ?? '').trim()
    const type = String(formData.get('type') ?? '').trim()
    const quantityRaw = Number(formData.get('quantity') ?? 0)
    const reason = String(formData.get('reason') ?? '').trim()

    const parsed = stockAdjustmentSchema.parse({
      variantId,
      warehouseId,
      type,
      quantity: quantityRaw,
      reason,
      actorUserId: actor.userId,
    })

    await adjustStock(parsed)

    revalidatePath('/admin/inventory')
    revalidatePath('/admin/inventory/movements')

    return {
      status: 'success',
      message: `Stock successfully adjusted (${parsed.type}: ${parsed.quantity > 0 ? '+' : ''}${parsed.quantity}).`,
    }
  } catch (error) {
    return failure(error)
  }
}
