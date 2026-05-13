import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './protected-route'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'

vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: vi.fn(),
}))

const asCurrentUserResult = (value: unknown) =>
  value as ReturnType<typeof useCurrentUser>

const renderProtectedRoute = (initialPath = '/app') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a loading state while the current user is loading', () => {
    vi.mocked(useCurrentUser).mockReturnValue(
      asCurrentUserResult({
        data: undefined,
        error: null,
        isError: false,
        isLoading: true,
      }),
    )

    renderProtectedRoute()

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })

  it('redirects anonymous users to login', () => {
    vi.mocked(useCurrentUser).mockReturnValue(
      asCurrentUserResult({
        data: null,
        error: null,
        isError: false,
        isLoading: false,
      }),
    )

    renderProtectedRoute()

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders nested routes for authenticated users', () => {
    vi.mocked(useCurrentUser).mockReturnValue(
      asCurrentUserResult({
        data: {
          email: 'employee@example.com',
          employee: { firstName: 'Maya', id: 'employee-1', lastName: 'Rivers' },
          id: 'user-1',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        },
        error: null,
        isError: false,
        isLoading: false,
      }),
    )

    renderProtectedRoute()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
