import { getRolePermissions, hasPermission } from './permissions'

describe('client permissions', () => {
  it('does not expose admin permissions to employees', () => {
    const employeePermissions = getRolePermissions('EMPLOYEE')

    expect(hasPermission(employeePermissions, 'profile:read:self')).toBe(true)
    expect(hasPermission(employeePermissions, 'employees:create')).toBe(false)
    expect(hasPermission(employeePermissions, 'payslips:upload')).toBe(false)
  })

  it('exposes management permissions to admins', () => {
    const adminPermissions = getRolePermissions('ADMIN')

    expect(hasPermission(adminPermissions, 'employees:create')).toBe(true)
    expect(hasPermission(adminPermissions, 'leave:approve:any')).toBe(true)
    expect(hasPermission(adminPermissions, 'auditLogs:read')).toBe(true)
  })
})
