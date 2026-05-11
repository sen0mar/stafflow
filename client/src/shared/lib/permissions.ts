export type Permission =
  | 'dashboard:read:admin'
  | 'dashboard:read:self'
  | 'employees:read:any'
  | 'employees:create'
  | 'employees:update:any'
  | 'employees:delete'
  | 'departments:read'
  | 'departments:manage'
  | 'attendance:read:any'
  | 'attendance:update:any'
  | 'leave:read:any'
  | 'leave:approve:any'
  | 'leave:reject:any'
  | 'payslips:read:any'
  | 'payslips:upload'
  | 'payslips:delete'
  | 'settings:manage'
  | 'auditLogs:read'
  | 'profile:read:self'
  | 'profile:update:self'
  | 'attendance:read:self'
  | 'attendance:clock:self'
  | 'leave:create:self'
  | 'leave:read:self'
  | 'payslips:read:self'

export type PermissionRole = 'ADMIN' | 'EMPLOYEE'

export const rolePermissions = {
  ADMIN: [
    'dashboard:read:admin',
    'employees:read:any',
    'employees:create',
    'employees:update:any',
    'employees:delete',
    'departments:read',
    'departments:manage',
    'attendance:read:any',
    'attendance:update:any',
    'leave:read:any',
    'leave:approve:any',
    'leave:reject:any',
    'payslips:read:any',
    'payslips:upload',
    'payslips:delete',
    'settings:manage',
    'auditLogs:read',
  ],
  EMPLOYEE: [
    'dashboard:read:self',
    'departments:read',
    'profile:read:self',
    'profile:update:self',
    'attendance:read:self',
    'attendance:clock:self',
    'leave:create:self',
    'leave:read:self',
    'payslips:read:self',
  ],
} as const satisfies Record<PermissionRole, readonly Permission[]>

export const getRolePermissions = (role: PermissionRole): Permission[] => [
  ...rolePermissions[role],
]

export const hasPermission = (
  permissions: readonly Permission[],
  requiredPermission: Permission,
) => permissions.includes(requiredPermission)
