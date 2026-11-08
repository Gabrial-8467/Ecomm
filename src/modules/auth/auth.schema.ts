import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address.')
  .max(254)

/** Accepts +91/91/0 prefixes and 10-digit Indian mobile numbers. */
export function normaliseIndianPhone(value: string): string {
  const digits = value.replace(/[^\d+]/g, '')
  let local: string
  if (digits.startsWith('+91')) local = digits.slice(3)
  else if (digits.startsWith('91') && digits.length === 12) local = digits.slice(2)
  else if (digits.startsWith('0') && digits.length === 11) local = digits.slice(1)
  else local = digits

  if (!/^[6-9]\d{9}$/.test(local)) {
    throw new Error('Enter a valid 10-digit Indian mobile number.')
  }
  return `+91${local}`
}

export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Enter a mobile number.')
  .max(20, 'Enter a valid mobile number.')
  .transform((value, ctx) => {
    try {
      return normaliseIndianPhone(value)
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Enter a valid mobile number.',
      })
      return z.NEVER
    }
  })

export const passwordSchema = z
  .string()
  .min(1, 'Enter a password.')
  .max(128, 'Use no more than 128 characters.')

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().max(80).optional(),
    marketingOptIn: z.boolean().optional(),
  })
  .strict()

export const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict()

export const tokenSchema = z
  .object({
    token: z.string().trim().min(20).max(256),
  })
  .strict()

export const emailOnlySchema = z.object({ email: emailSchema }).strict()

export const otpPurposeSchema = z.enum(['login', 'verify', 'register'])

export const otpRequestSchema = z
  .object({
    phone: phoneSchema,
    purpose: otpPurposeSchema.default('login'),
  })
  .strict()

export const otpVerifySchema = z
  .object({
    phone: phoneSchema,
    purpose: otpPurposeSchema.default('login'),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code.'),
  })
  .strict()

export const passwordResetSchema = z
  .object({
    token: z.string().trim().min(20).max(256),
    password: passwordSchema,
  })
  .strict()

export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .strict()

export const mfaChallengeSchema = z
  .object({ challengeToken: z.string().trim().min(20).max(256) })
  .strict()

export const mfaVerifySchema = z
  .object({
    challengeToken: z.string().trim().min(20).max(256),
    code: z
      .string()
      .trim()
      .min(6, 'Enter the code from your authenticator app.')
      .max(20, 'Enter the code from your authenticator app.'),
  })
  .strict()

export const profileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter your first name.').max(80),
    lastName: z.string().trim().max(80).optional(),
    preferredLanguage: z.enum(['en-IN', 'hi-IN']).default('en-IN'),
    marketingOptIn: z.boolean().default(false),
  })
  .strict()

export const sessionRevokeSchema = z
  .object({ sessionId: z.string().trim().min(10).max(64) })
  .strict()

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OtpRequestInput = z.infer<typeof otpRequestSchema>
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
