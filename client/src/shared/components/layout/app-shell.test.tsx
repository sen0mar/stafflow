import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { useDemoMode } from '@/features/auth/hooks/use-auth-config'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { AppShell } from './app-shell'

vi.mock('@/features/auth/hooks/use-auth-config', () => ({
  useDemoMode: vi.fn(),
}))

vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('@/features/auth/hooks/use-logout', () => ({
  useLogout: vi.fn(),
}))

const asCurrentUserResult = (value: unknown) =>
  value as ReturnType<typeof useCurrentUser>
const asLogoutResult = (value: unknown) => value as ReturnType<typeof useLogout>

const renderShell = () =>
  render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/app" element={<div>Dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('AppShell demo mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCurrentUser).mockReturnValue(
      asCurrentUserResult({
        data: {
          email: 'admin.demo@example.com',
          employee: null,
          id: 'admin-1',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      }),
    )
    vi.mocked(useLogout).mockReturnValue(
      asLogoutResult({ isPending: false, mutate: vi.fn() }),
    )
  })

  it('shows the read-only banner when server configuration enables demo mode', () => {
    vi.mocked(useDemoMode).mockReturnValue(true)

    renderShell()

    expect(screen.getByRole('status')).toHaveTextContent(
      'this workspace is read-only',
    )
  })

  it('does not show the banner in a private deployment', () => {
    vi.mocked(useDemoMode).mockReturnValue(false)

    renderShell()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
