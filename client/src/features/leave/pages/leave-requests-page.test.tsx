import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import type { LeaveRequest } from '../api/leave.api'
import { LeaveRequestsTable } from '../components/leave-requests-table'
import { LeaveRequestsPage } from './leave-requests-page'

vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: vi.fn(),
}))
vi.mock('../components/admin-leave-requests', () => ({
  AdminLeaveRequests: () => <div>Admin leave flow</div>,
}))
vi.mock('../components/employee-leave-requests', () => ({
  EmployeeLeaveRequests: () => <div>Employee leave flow</div>,
}))

const request = {
  employee: {
    department: { id: 'department-1', name: 'Engineering' },
    fullName: 'Maya Rivers',
    id: 'employee-1',
  },
  endDate: '2026-07-18',
  id: 'request-1',
  leaveType: { id: 'type-1', name: 'Annual' },
  reason: 'Family event',
  reviewNote: null,
  startDate: '2026-07-17',
  status: 'PENDING',
  totalDays: 2,
} as LeaveRequest

describe('LeaveRequestsPage', () => {
  it.each([
    ['ADMIN', 'Admin leave flow'],
    ['EMPLOYEE', 'Employee leave flow'],
  ] as const)('composes the %s flow', (role, text) => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { role },
      isLoading: false,
    } as ReturnType<typeof useCurrentUser>)
    render(<LeaveRequestsPage />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('preserves request table review actions and note presentation', async () => {
    const onApprove = vi.fn()
    render(
      <LeaveRequestsTable
        canReview
        noteMode="reason"
        requests={[request]}
        onApprove={onApprove}
      />,
    )
    expect(screen.getByText('Maya Rivers')).toBeInTheDocument()
    expect(screen.getByText('Family event')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onApprove).toHaveBeenCalledWith(request)
  })
})
