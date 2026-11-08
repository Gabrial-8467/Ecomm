import 'server-only'

import type { TokenType } from '@/generated/prisma/enums'
import { hashToken, randomToken } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'

export interface IssuedToken {
  id: string
  /** Raw value delivered out-of-band. Never logged or persisted. */
  token: string
  expiresAt: Date
}

export async function issueToken(input: {
  type: TokenType
  userId?: string | null
  identifier?: string | null
  ttlMs: number
  codeHash?: string | null
  ip?: string | null
  maxAttempts?: number
}): Promise<IssuedToken> {
  const token = randomToken(32)
  const expiresAt = new Date(Date.now() + input.ttlMs)

  const row = await prisma.verificationToken.create({
    data: {
      tokenHash: hashToken(token),
      type: input.type,
      userId: input.userId ?? null,
      identifier: input.identifier ?? null,
      codeHash: input.codeHash ?? null,
      ip: input.ip ?? null,
      maxAttempts: input.maxAttempts ?? 5,
      expiresAt,
    },
    select: { id: true },
  })

  return { id: row.id, token, expiresAt }
}

export async function findActiveToken(token: string, type: TokenType) {
  if (!token) return null
  const row = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  })
  if (!row) return null
  if (row.type !== type) return null
  if (row.consumedAt) return null
  if (row.expiresAt.getTime() <= Date.now()) return null
  return row
}

/** Atomically consume a token so two concurrent requests cannot both succeed. */
export async function consumeToken(id: string): Promise<boolean> {
  const result = await prisma.verificationToken.updateMany({
    where: { id, consumedAt: null },
    data: { consumedAt: new Date() },
  })
  return result.count === 1
}

export async function incrementTokenAttempts(id: string): Promise<number> {
  const updated = await prisma.verificationToken.update({
    where: { id },
    data: { attempts: { increment: 1 } },
    select: { attempts: true },
  })
  return updated.attempts
}

export async function findLatestOtp(identifier: string, type: TokenType) {
  return prisma.verificationToken.findFirst({
    where: {
      identifier,
      type,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/** Invalidate all outstanding tokens of a type for a user/identifier. */
export async function invalidateTokens(input: {
  type: TokenType
  userId?: string | null
  identifier?: string | null
}): Promise<void> {
  await prisma.verificationToken.updateMany({
    where: {
      type: input.type,
      consumedAt: null,
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.identifier ? { identifier: input.identifier } : {}),
    },
    data: { consumedAt: new Date() },
  })
}
