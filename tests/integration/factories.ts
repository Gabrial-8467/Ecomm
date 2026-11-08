import type { Role, User } from '@/generated/prisma/client'
import type { UserStatus } from '@/generated/prisma/enums'
import { hashPassword } from '@/lib/auth/passwords'
import { prisma } from '@/lib/prisma'

export const TEST_PASSWORD = 'Correct-Horse-Battery-9!'

/**
 * Truncates every application table except Prisma's migration ledger. Call
 * from `beforeEach`; integration tests run against a dedicated database.
 */
export async function resetDatabase(): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  if (tables.length === 0) return

  const list = tables
    .map(({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`)
    .join(', ')
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
}

export async function createCustomerUser(
  input: {
    email?: string
    phone?: string
    password?: string | null
    status?: UserStatus
    emailVerified?: boolean
    phoneVerified?: boolean
  } = {},
): Promise<User> {
  const passwordHash =
    input.password === null ? null : await hashPassword(input.password ?? TEST_PASSWORD)

  return prisma.user.create({
    data: {
      email: input.email ?? `customer-${crypto.randomUUID()}@example.com`,
      phone: input.phone,
      passwordHash,
      firstName: 'Test',
      lastName: 'Customer',
      status: input.status ?? 'ACTIVE',
      emailVerifiedAt: input.emailVerified === false ? null : new Date(),
      phoneVerifiedAt: input.phoneVerified ? new Date() : null,
      customerProfile: { create: {} },
    },
  })
}

export async function createStaffUser(
  input: {
    email?: string
    password?: string | null
    roles?: string[]
    status?: UserStatus
  } = {},
): Promise<User & { userRoles: { role: Role }[] }> {
  const passwordHash =
    input.password === null ? null : await hashPassword(input.password ?? TEST_PASSWORD)

  const roles = input.roles ?? ['ADMIN']
  const roleRows = await Promise.all(
    roles.map((code) =>
      prisma.role.upsert({
        where: { code },
        update: {},
        create: { code, name: code.replaceAll('_', ' '), isSystem: true },
      }),
    ),
  )

  return prisma.user.create({
    data: {
      email: input.email ?? `staff-${crypto.randomUUID()}@example.com`,
      passwordHash,
      firstName: 'Test',
      lastName: 'Staff',
      status: input.status ?? 'ACTIVE',
      emailVerifiedAt: new Date(),
      adminProfile: { create: {} },
      userRoles: { create: roleRows.map((role) => ({ roleId: role.id })) },
    },
    include: { userRoles: { include: { role: true } } },
  })
}

export async function grantPermission(roleCode: string, permissionCode: string): Promise<void> {
  const role = await prisma.role.upsert({
    where: { code: roleCode },
    update: {},
    create: { code: roleCode, name: roleCode.replaceAll('_', ' '), isSystem: true },
  })
  const permission = await prisma.permission.upsert({
    where: { code: permissionCode },
    update: {},
    create: { code: permissionCode, description: permissionCode },
  })
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    update: {},
    create: { roleId: role.id, permissionId: permission.id },
  })
}

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}-${crypto.randomUUID()}@example.com`
}

export function uniquePhone(): string {
  // Valid Indian mobile shape: starts 6-9, ten digits.
  const suffix = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0')
  return `+919${suffix}`
}
