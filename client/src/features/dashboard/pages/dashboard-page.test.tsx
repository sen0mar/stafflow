import { render, screen } from '@testing-library/react'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { DashboardPage } from './dashboard-page'

vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: vi.fn(),
}))
vi.mock('../components/admin-dashboard', () => ({
  AdminDashboard: () => <div>Admin dashboard composition</div>,
}))
vi.mock('../components/employee-dashboard', () => ({
  EmployeeDashboard: () => <div>Employee dashboard composition</div>,
}))
vi.mock('../components/dashboard-query-state', () => ({
  DashboardLoading: () => <div>Dashboard loading</div>,
}))

const setCurrentUser = (role: 'ADMIN' | 'EMPLOYEE', isLoading = false) => {
  vi.mocked(useCurrentUser).mockReturnValue({
    data: isLoading ? undefined : { role },
    isLoading,
  } as ReturnType<typeof useCurrentUser>)
}

describe('DashboardPage', () => {
  it.each([
    ['ADMIN', 'Admin dashboard composition'],
    ['EMPLOYEE', 'Employee dashboard composition'],
  ] as const)(
    'composes the %s dashboard for the current role',
    (role, text) => {
      setCurrentUser(role)
      render(<DashboardPage />)
      expect(screen.getByText(text)).toBeInTheDocument()
    },
  )

  it('preserves the role-query loading state', () => {
    setCurrentUser('EMPLOYEE', true)
    render(<DashboardPage />)
    expect(screen.getByText('Dashboard loading')).toBeInTheDocument()
  })
})
