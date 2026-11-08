export interface ActionResult {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
}

export const idleResult: ActionResult = { status: 'idle' }
