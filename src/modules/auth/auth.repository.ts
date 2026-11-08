import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

const AUTH_USER_INCLUDE = {
  userRoles: { include: { role: true } },
  adminProfile: true,
  mfaCredential: true,
  customerProfile: true,
} as const

export type AuthUser = Prisma.UserGetPayload<{ include: typeof AUTH_USER_INCLUDE }>

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  return prisma.user.findUnique({ where: { email }, include: AUTH_USER_INCLUDE })
}

export async function findUserByPhone(phone: string): Promise<AuthUser | null> {
  return prisma.user.findUnique({ where: { phone }, include: AUTH_USER_INCLUDE })
}

export async function findUserById(userId: string): Promise<AuthUser | null> {
  return prisma.user.findUnique({ where: { id: userId }, include: AUTH_USER_INCLUDE })
}

export async function emailExists(email: string): Promise<boolean> {
  return (await prisma.user.count({ where: { email } })) > 0
}

export async function phoneExists(phone: string): Promise<boolean> {
  return (await prisma.user.count({ where: { phone } })) > 0
}

export async function createCustomer(input: {
  email?: string
  phone?: string
  passwordHash?: string
  firstName?: string
  lastName?: string
  marketingOptIn?: boolean
  status: 'ACTIVE' | 'PENDING_VERIFICATION'
  emailVerifiedAt?: Date
  phoneVerifiedAt?: Date
}): Promise<AuthUser> {
  return prisma.user.create({
    data: {
      email: input.email,
      phone: input.phone,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      marketingOptIn: input.marketingOptIn ?? false,
      status: input.status,
      emailVerifiedAt: input.emailVerifiedAt,
      phoneVerifiedAt: input.phoneVerifiedAt,
      customerProfile: { create: {} },
    },
    include: AUTH_USER_INCLUDE,
  })
}

export async function markLoginSuccess(userId: string, passwordHash?: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      ...(passwordHash ? { passwordHash } : {}),
    },
  })
}

export async function recordFailedLogin(
  userId: string,
  maxFailures: number,
  lockMs: number,
): Promise<{ attempts: number; lockedUntil: Date | null }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true },
  })

  if (user.failedLoginCount >= maxFailures) {
    const lockedUntil = new Date(Date.now() + lockMs)
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil, failedLoginCount: 0 },
    })
    return { attempts: user.failedLoginCount, lockedUntil }
  }

  return { attempts: user.failedLoginCount, lockedUntil: null }
}

export async function setEmailVerified(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  })
}

export async function setPhoneVerified(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneVerifiedAt: new Date(),
      status: 'ACTIVE',
      lastLoginAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  })
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  })
}

export async function updateCustomerProfile(
  userId: string,
  input: {
    firstName: string
    lastName?: string
    preferredLanguage: string
    marketingOptIn: boolean
  },
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        marketingOptIn: input.marketingOptIn,
      },
    }),
    prisma.customerProfile.upsert({
      where: { userId },
      update: { preferredLanguage: input.preferredLanguage },
      create: { userId, preferredLanguage: input.preferredLanguage },
    }),
  ])
}

export async function findMfaCredential(userId: string) {
  return prisma.mfaCredential.findUnique({ where: { userId } })
}

export async function upsertMfaCredential(input: {
  userId: string
  secretEncrypted: string
  recoveryHashes: string[]
}): Promise<void> {
  await prisma.mfaCredential.upsert({
    where: { userId: input.userId },
    update: {
      secretEncrypted: input.secretEncrypted,
      backupCodesHashed: input.recoveryHashes,
      enabledAt: null,
      lastUsedAt: null,
    },
    create: {
      userId: input.userId,
      secretEncrypted: input.secretEncrypted,
      backupCodesHashed: input.recoveryHashes,
    },
  })
}

export async function enableMfaCredential(userId: string): Promise<void> {
  await prisma.mfaCredential.update({
    where: { userId },
    data: { enabledAt: new Date(), lastUsedAt: new Date() },
  })
}

export async function updateMfaLastUsed(userId: string): Promise<void> {
  await prisma.mfaCredential.update({
    where: { userId },
    data: { lastUsedAt: new Date() },
  })
}

export async function updateMfaRecoveryHashes(userId: string, hashes: string[]): Promise<void> {
  await prisma.mfaCredential.update({
    where: { userId },
    data: { backupCodesHashed: hashes, lastUsedAt: new Date() },
  })
}
