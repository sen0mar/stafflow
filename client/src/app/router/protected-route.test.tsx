import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './protected-route'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { ApiClientError } from '@/shared/lib/api-client'

vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: vi.fn(),
}))

const asCurrentUserResult = (value: unknown) =>
  value as ReturnType<typeof useCurrentUser>

const authenticatedUser = {
  email: 'employee@example.com',
  employee: { firstName: 'Maya', id: 'employee-1', lastName: 'Rivers' },
  id: 'user-1',
  role: 'EMPLOYEE' as const,
  status: 'ACTIVE' as const,
}

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
        data: authenticatedUser,
        error: null,
        isError: false,
        isLoading: false,
      }),
    )

    renderProtectedRoute()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it.each([
    ['server failure', new ApiClientError('Internal details', 500)],
    ['network failure', new TypeError('Failed to fetch')],
  ])(
    'shows a retryable full-page error without mounting protected content for a %s',
    (_label, error) => {
      const refetch = vi.fn()
      vi.mocked(useCurrentUser).mockReturnValue(
        asCurrentUserResult({
          data: undefined,
          error,
          isError: true,
          isFetching: false,
          isLoading: false,
          refetch,
        }),
      )

      renderProtectedRoute()

      expect(
        screen.getByRole('heading', {
          name: 'We could not confirm your session',
        }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
      expect(screen.queryByText('Login page')).not.toBeInTheDocument()
    },
  )

  it('mounts the protected route after a failed auth check retries successfully', async () => {
    const user = userEvent.setup()

    const useRetryingCurrentUserMock = () => {
      const [hasRetried, setHasRetried] = useState(false)

      return asCurrentUserResult(
        hasRetried
          ? {
              data: authenticatedUser,
              error: null,
              isError: false,
              isFetching: false,
              isLoading: false,
            }
          : {
              data: undefined,
              error: new ApiClientError('Unavailable', 503),
              isError: true,
              isFetching: false,
              isLoading: false,
              refetch: async () => {
                setHasRetried(true)
                return undefined
              },
            },
      )
    }

    vi.mocked(useCurrentUser).mockImplementation(useRetryingCurrentUserMock)
    renderProtectedRoute()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Protected content')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', {
        name: 'We could not confirm your session',
      }),
    ).not.toBeInTheDocument()
  })
})
