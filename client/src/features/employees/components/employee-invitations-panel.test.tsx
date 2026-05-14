import { fireEvent, render, screen } from '@testing-library/react'
import { EmployeeInvitationsPanel } from './employee-invitations-panel'
import type { EmployeeInvitation } from '../api/employees.api'

const invitations: EmployeeInvitation[] = [
  {
    accountId: 'account-1',
    email: 'maya.rivers@example.com',
    employeeId: 'employee-1',
    employeeName: 'Maya Rivers',
    expiresAt: '2026-05-21T00:00:00.000Z',
  },
  {
    accountId: 'account-2',
    email: 'noah.bennett@example.com',
    employeeId: 'employee-2',
    employeeName: 'Noah Bennett',
    expiresAt: '2026-05-22T00:00:00.000Z',
  },
]

const defaultProps = {
  copiedEmployeeId: null,
  generatingEmployeeId: null,
  hasError: false,
  invitations,
  onDismissLink: vi.fn(),
  onGenerateLink: vi.fn(),
  setupUrlsByEmployeeId: {},
}

describe('EmployeeInvitationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders multiple pending invitation rows', () => {
    render(<EmployeeInvitationsPanel {...defaultProps} />)

    expect(screen.getByText('Pending invitations')).toBeInTheDocument()
    expect(screen.getByText('Maya Rivers')).toBeInTheDocument()
    expect(screen.getByText('maya.rivers@example.com')).toBeInTheDocument()
    expect(screen.getByText('Noah Bennett')).toBeInTheDocument()
    expect(screen.getByText('noah.bennett@example.com')).toBeInTheDocument()
  })

  it('requests a generated link for rows without a one-time setup URL', () => {
    render(<EmployeeInvitationsPanel {...defaultProps} />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Generate link' })[0])

    expect(defaultProps.onGenerateLink).toHaveBeenCalledWith(invitations[0])
  })

  it('shows and copies a one-time setup URL when present', () => {
    render(
      <EmployeeInvitationsPanel
        {...defaultProps}
        copiedEmployeeId="employee-1"
        setupUrlsByEmployeeId={{
          'employee-1':
            'http://localhost:5173/accept-invitation?token=invite-token',
        }}
      />,
    )

    expect(
      screen.getByText(
        'http://localhost:5173/accept-invitation?token=invite-token',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide link' })).toBeInTheDocument()
  })

  it('removes accepted or expired rows when invitations change', () => {
    const { rerender } = render(<EmployeeInvitationsPanel {...defaultProps} />)

    rerender(
      <EmployeeInvitationsPanel
        {...defaultProps}
        invitations={[invitations[1]]}
      />,
    )

    expect(screen.queryByText('Maya Rivers')).not.toBeInTheDocument()
    expect(screen.getByText('Noah Bennett')).toBeInTheDocument()
  })
})
