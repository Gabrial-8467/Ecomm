/**
 * Server-side permission catalogue. Route handlers, server actions and the
 * admin UI all evaluate the same codes. The UI is a convenience layer only;
 * every mutation must re-check permission on the server.
 */

export const PERMISSIONS = [
  'dashboard:read',

  'catalog:read',
  'catalog:write',
  'catalog:publish',
  'catalog:delete',

  'inventory:read',
  'inventory:write',
  'inventory:adjust',
  'inventory:transfer',

  'orders:read',
  'orders:write',
  'orders:cancel',
  'orders:refund',

  'payments:read',
  'payments:write',
  'payments:refund',

  'returns:read',
  'returns:write',
  'returns:approve',

  'shipments:read',
  'shipments:write',

  'customers:read',
  'customers:write',
  'customers:erase',

  'reviews:read',
  'reviews:moderate',
  'questions:moderate',

  'coupons:read',
  'coupons:write',

  'cms:read',
  'cms:write',
  'cms:publish',

  'support:read',
  'support:write',
  'grievances:read',
  'grievances:write',

  'reports:read',
  'audit:read',
  'settings:read',
  'settings:write',
  'staff:read',
  'staff:write',
  'privacy:read',
  'privacy:write',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PRODUCT_MANAGER: 'PRODUCT_MANAGER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  ORDER_MANAGER: 'ORDER_MANAGER',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  FINANCE_MANAGER: 'FINANCE_MANAGER',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
} as const

export type RoleCode = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_PERMISSIONS: Record<RoleCode, readonly (Permission | '*')[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'dashboard:read',
    'catalog:read',
    'catalog:write',
    'catalog:publish',
    'catalog:delete',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'inventory:transfer',
    'orders:read',
    'orders:write',
    'orders:cancel',
    'payments:read',
    'returns:read',
    'returns:write',
    'shipments:read',
    'shipments:write',
    'customers:read',
    'customers:write',
    'reviews:read',
    'reviews:moderate',
    'questions:moderate',
    'coupons:read',
    'coupons:write',
    'cms:read',
    'cms:write',
    'cms:publish',
    'support:read',
    'support:write',
    'grievances:read',
    'grievances:write',
    'reports:read',
    'audit:read',
    'settings:read',
    'staff:read',
    'privacy:read',
  ],
  PRODUCT_MANAGER: [
    'dashboard:read',
    'catalog:read',
    'catalog:write',
    'catalog:publish',
    'catalog:delete',
    'inventory:read',
    'reviews:read',
    'reviews:moderate',
    'questions:moderate',
    'reports:read',
  ],
  INVENTORY_MANAGER: [
    'dashboard:read',
    'catalog:read',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'inventory:transfer',
    'reports:read',
  ],
  ORDER_MANAGER: [
    'dashboard:read',
    'orders:read',
    'orders:write',
    'orders:cancel',
    'returns:read',
    'returns:write',
    'returns:approve',
    'shipments:read',
    'shipments:write',
    'customers:read',
    'reports:read',
  ],
  CUSTOMER_SUPPORT: [
    'dashboard:read',
    'orders:read',
    'returns:read',
    'returns:write',
    'customers:read',
    'reviews:read',
    'questions:moderate',
    'support:read',
    'support:write',
    'grievances:read',
    'grievances:write',
  ],
  FINANCE_MANAGER: [
    'dashboard:read',
    'orders:read',
    'orders:refund',
    'payments:read',
    'payments:write',
    'payments:refund',
    'returns:read',
    'returns:approve',
    'reports:read',
    'audit:read',
  ],
  CONTENT_MANAGER: [
    'dashboard:read',
    'catalog:read',
    'cms:read',
    'cms:write',
    'cms:publish',
    'reviews:read',
    'questions:moderate',
  ],
}

export function roleHasPermission(role: RoleCode, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[role]
  return granted.includes('*') || granted.includes(permission)
}

/**
 * Resolve a flat list of permission codes (as loaded with the session) against
 * a requirement. Supports exact codes; wildcards are expanded from ROLE_PERMISSIONS.
 */
export function hasPermission(granted: readonly string[], required: Permission): boolean {
  if (granted.includes('*') || granted.includes(required)) return true
  const [resource] = required.split(':')
  return granted.includes(`${resource}:*`)
}

export function hasAnyPermission(
  granted: readonly string[],
  required: readonly Permission[],
): boolean {
  return required.some((permission) => hasPermission(granted, permission))
}

export function hasAllPermissions(
  granted: readonly string[],
  required: readonly Permission[],
): boolean {
  return required.every((permission) => hasPermission(granted, permission))
}
