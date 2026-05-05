export type Permission = string

export const hasPermission = (
  permissions: readonly Permission[],
  requiredPermission: Permission,
) => permissions.includes(requiredPermission)
