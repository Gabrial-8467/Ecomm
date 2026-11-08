'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { clearAuthCookies, setAuthCookies } from '@/lib/auth/cookies'
import {
  getCurrentSession,
  requireCurrentActor,
  requireCurrentSession,
  verifyCsrfForCurrentSession,
} from '@/lib/auth/guards'
import { isAppError, ValidationError } from '@/lib/errors'
import {
  changePassword,
  login,
  logout,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  revokeOwnSession,
  updateProfile,
  verifyEmail,
} from '@/modules/auth'
import {
  changePasswordSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  sessionRevokeSchema,
} from '@/modules/auth/auth.schema'

export interface ActionState {
  status: 'idle' | 'error' | 'success' | 'mfa'
  message?: string
  code?: string
  challengeToken?: string
  setupRequired?: boolean
  fieldErrors?: Record<string, string[]>
}

async function actionContext() {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  return {
    ip: forwarded?.split(',')[0]?.trim() ?? headerList.get('x-real-ip'),
    userAgent: headerList.get('user-agent'),
    requestId: headerList.get('x-request-id'),
  }
}

function failure(error: unknown): ActionState {
  if (isAppError(error)) {
    return { status: 'error', message: error.message, code: error.code }
  }
  throw error
}

function fieldFailure(error: ValidationError): ActionState {
  const details = Array.isArray(error.details)
    ? (error.details as { path?: string; message?: string }[])
    : []
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of details) {
    if (!issue.path) continue
    fieldErrors[issue.path] = [
      ...(fieldErrors[issue.path] ?? []),
      issue.message ?? 'Invalid value.',
    ]
  }
  return { status: 'error', message: error.message, fieldErrors }
}

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Check your details.' }
  }

  try {
    const result = await login(parsed.data, await actionContext())
    if (result.status === 'mfa_required') {
      return {
        status: 'mfa',
        challengeToken: result.challengeToken,
        setupRequired: result.setupRequired,
        message: result.setupRequired
          ? 'Set up an authenticator app to finish signing in.'
          : 'Enter the code from your authenticator app.',
      }
    }

    await setAuthCookies({
      kind: result.session.kind,
      token: result.session.token,
      csrfToken: result.session.csrfToken,
      maxAgeSeconds: result.session.maxAgeSeconds,
    })
  } catch (error) {
    if (isAppError(error)) return failure(error)
    throw error
  }

  redirect('/account')
}

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if ((formData.get('company') as string | null)?.trim()) {
    return { status: 'success', message: 'Account created. Check your email to verify it.' }
  }

  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName') || undefined,
    lastName: formData.get('lastName') || undefined,
    marketingOptIn: formData.get('marketingOptIn') === 'on',
  })
  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Check the form and try again.',
    }
  }

  try {
    await register(parsed.data, await actionContext())
    return {
      status: 'success',
      message: 'Account created. Check your email for a verification link before signing in.',
    }
  } catch (error) {
    if (error instanceof ValidationError) return fieldFailure(error)
    if (isAppError(error)) return failure(error)
    throw error
  }
}

export async function resendVerificationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase()
  if (!email) return { status: 'error', message: 'Enter your email address.' }

  try {
    await resendVerification(email, await actionContext())
    return {
      status: 'success',
      message: 'If that address needs verification, a new link has been sent.',
    }
  } catch (error) {
    if (isAppError(error)) return failure(error)
    throw error
  }
}

export async function forgotPasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase()
  if (!email) return { status: 'error', message: 'Enter your email address.' }

  try {
    await requestPasswordReset(email, await actionContext())
    return {
      status: 'success',
      message: 'If an account exists for that address, a password reset link has been sent.',
    }
  } catch (error) {
    if (isAppError(error)) return failure(error)
    throw error
  }
}

export async function verifyEmailAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = (formData.get('token') as string | null)?.trim()
  if (!token) return { status: 'error', message: 'This verification link is incomplete.' }

  try {
    await verifyEmail(token, await actionContext())
    return { status: 'success', message: 'Email verified. You can now sign in.' }
  } catch (error) {
    if (isAppError(error)) return failure(error)
    throw error
  }
}

export async function resetPasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = (formData.get('token') as string | null)?.trim()
  const password = formData.get('password') as string | null
  if (!token) return { status: 'error', message: 'This reset link is incomplete.' }

  const parsed = changePasswordSchema
    .pick({ newPassword: true })
    .safeParse({ newPassword: password ?? '' })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Enter a new password.' }
  }

  try {
    await resetPassword(token, parsed.data.newPassword, await actionContext())
    return {
      status: 'success',
      message:
        'Password updated. All sessions have been signed out; sign in with the new password.',
    }
  } catch (error) {
    if (error instanceof ValidationError) return fieldFailure(error)
    if (isAppError(error)) return failure(error)
    throw error
  }
}

export async function logoutAction(formData: FormData): Promise<void> {
  const session = await getCurrentSession()
  if (session) {
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())
    await logout(session, await actionContext())
  }
  await clearAuthCookies()
  redirect('/login')
}

export async function updateProfileAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requireCurrentActor()
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())

    const parsed = profileUpdateSchema.safeParse({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName') || undefined,
      preferredLanguage: formData.get('preferredLanguage') ?? 'en-IN',
      marketingOptIn: formData.get('marketingOptIn') === 'on',
    })
    if (!parsed.success) {
      return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Check your details.' }
    }

    await updateProfile(actor, parsed.data)
    revalidatePath('/account')
    return { status: 'success', message: 'Profile updated.' }
  } catch (error) {
    if (isAppError(error)) return failure(error)
    throw error
  }
}

export async function changePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const session = await requireCurrentSession()
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())

    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
    })
    if (!parsed.success) {
      return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Check the form.' }
    }

    const next = await changePassword(
      session,
      parsed.data.currentPassword,
      parsed.data.newPassword,
      await actionContext(),
    )
    await setAuthCookies({
      kind: next.kind,
      token: next.token,
      csrfToken: next.csrfToken,
      maxAgeSeconds: next.maxAgeSeconds,
    })
    revalidatePath('/account')
    return { status: 'success', message: 'Password changed. Other sessions were signed out.' }
  } catch (error) {
    if (error instanceof ValidationError) return fieldFailure(error)
    if (isAppError(error)) return failure(error)
    throw error
  }
}

export async function revokeSessionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requireCurrentActor()
    await verifyCsrfForCurrentSession(formData.get('csrfToken')?.toString())
    const parsed = sessionRevokeSchema.safeParse({ sessionId: formData.get('sessionId') })
    if (!parsed.success) return { status: 'error', message: 'Invalid session.' }

    await revokeOwnSession(actor, parsed.data.sessionId, await actionContext())

    if (parsed.data.sessionId === actor.sessionId) {
      await clearAuthCookies()
      redirect('/login')
    }

    revalidatePath('/account')
    return { status: 'success', message: 'Session revoked.' }
  } catch (error) {
    if (isAppError(error)) return failure(error)
    throw error
  }
}
