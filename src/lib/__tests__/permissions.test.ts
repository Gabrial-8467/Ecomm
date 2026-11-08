import { describe, expect, it } from 'vitest'

import {
  ROLE_PERMISSIONS,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  roleHasPermission,
} from '@/lib/permissions'

describe('permissions', () => {
  it('grants everything to the wildcard role', () => {
    expect(roleHasPermission('SUPER_ADMIN', 'settings:write')).toBe(true)
  })

  it('limits product managers to catalogue-adjacent permissions', () => {
    expect(roleHasPermission('PRODUCT_MANAGER', 'catalog:write')).toBe(true)
    expect(roleHasPermission('PRODUCT_MANAGER', 'payments:refund')).toBe(false)
    expect(roleHasPermission('PRODUCT_MANAGER', 'settings:write')).toBe(false)
  })

  it('lets finance refund payments but not edit the catalogue', () => {
    expect(roleHasPermission('FINANCE_MANAGER', 'payments:refund')).toBe(true)
    expect(roleHasPermission('FINANCE_MANAGER', 'catalog:write')).toBe(false)
  })

  it('does not grant refunds to order managers by default', () => {
    expect(roleHasPermission('ORDER_MANAGER', 'orders:refund')).toBe(false)
  })

  it('supports resource wildcards in resolved session permissions', () => {
    expect(hasPermission(['catalog:*'], 'catalog:publish')).toBe(true)
    expect(hasPermission(['catalog:read'], 'catalog:publish')).toBe(false)
    expect(hasPermission([], 'catalog:read')).toBe(false)
  })

  it('combines permission checks', () => {
    expect(hasAnyPermission(['catalog:read'], ['catalog:write', 'catalog:read'])).toBe(true)
    expect(hasAllPermissions(['catalog:read'], ['catalog:read', 'catalog:write'])).toBe(false)
  })

  it('defines at least one role per operational function', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(8)
  })
})
