import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AuditLog } from '../api/audit-logs.api'
import { AuditLogDetailsDialog } from './audit-log-details-dialog'
import { AuditMetadata } from './audit-metadata'
import { AuditLogsTable } from './audit-logs-table'

const auditLog = {
  action: 'EMPLOYEE_UPDATED',
  actorUser: { email: 'admin@example.com' },
  actorUserId: 'admin-1',
  createdAt: '2026-07-16T10:00:00.000Z',
  entityId: 'employee-1',
  entityType: 'Employee',
  id: 'audit-1',
  ipAddress: '127.0.0.1',
  metadata: {
    changedFields: ['jobTitle'],
    from: { jobTitle: 'Engineer' },
    to: { jobTitle: 'Senior Engineer' },
  },
  userAgent: 'Vitest',
} as AuditLog

describe('audit log presentation', () => {
  it('renders structured old and new metadata', () => {
    render(<AuditMetadata metadata={auditLog.metadata} />)
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
  })

  it('preserves table detail actions', async () => {
    const onView = vi.fn()
    render(<AuditLogsTable auditLogs={[auditLog]} onView={onView} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'View EMPLOYEE_UPDATED audit log' }),
    )
    expect(onView).toHaveBeenCalledWith(auditLog)
  })

  it('renders the selected audit log dialog', () => {
    render(
      <AuditLogDetailsDialog
        auditLog={auditLog}
        isLoading={false}
        open
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Audit log details')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Sensitive metadata is redacted before it is stored and displayed.',
      ),
    ).toBeInTheDocument()
  })
})
