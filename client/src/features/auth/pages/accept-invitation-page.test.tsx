import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { toast } from 'sonner'

import { AcceptInvitationPage } from './accept-invitation-page'
import { useAcceptInvitation } from '../hooks/use-accept-invitation'
import { useDemoMode } from '../hooks/use-auth-config'

const mutate = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('../hooks/use-accept-invitation', () => ({
  useAcceptInvitation: vi.fn(),
}))

vi.mock('../hooks/use-auth-config', () => ({
  useDemoMode: vi.fn(),
}))

const asAcceptInvitationResult = (value: unknown) =>
  value as ReturnType<typeof useAcceptInvitation>

const renderPage = (path = '/accept-invitation#token=invite-token') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AcceptInvitationPage />
    </MemoryRouter>,
  )

describe('AcceptInvitationPage', () => {
  let replaceStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    replaceStateSpy = vi
      .spyOn(window.history, 'replaceState')
      .mockImplementation(() => undefined)
    vi.mocked(useDemoMode).mockReturnValue(false)
    vi.mocked(useAcceptInvitation).mockReturnValue(
      asAcceptInvitationResult({
        isPending: false,
        mutate,
      }),
    )
  })

  afterEach(() => {
    replaceStateSpy.mockRestore()
  })

  it('shows an invalid invitation state when the token is missing', () => {
    renderPage('/accept-invitation')

    expect(screen.getByText('Invalid invitation link')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Set password' }),
    ).not.toBeInTheDocument()
  })

  it('disables invitation acceptance in demo mode', () => {
    vi.mocked(useDemoMode).mockReturnValue(true)

    renderPage()

    expect(
      screen.getByText('Invitations are disabled in the public demo'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Set password' }),
    ).not.toBeInTheDocument()
  })

  it('requires matching passwords before accepting an invitation', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'long-enough-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'different-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Set password' }))

    expect(mutate).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Passwords do not match.')
  })

  it('captures and scrubs a fragment token before accepting the invitation', () => {
    renderPage('/accept-invitation?source=admin#token=invite-token%2Bencoded')

    expect(replaceStateSpy).toHaveBeenCalledWith(
      window.history.state,
      '',
      '/accept-invitation?source=admin',
    )

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'long-enough-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'long-enough-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Set password' }))

    expect(mutate).toHaveBeenCalledWith(
      {
        password: 'long-enough-password',
        token: 'invite-token+encoded',
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    )
    expect(replaceStateSpy.mock.invocationCallOrder[0]).toBeLessThan(
      mutate.mock.invocationCallOrder[0],
    )
  })

  it('captures and scrubs a legacy query token before accepting it', () => {
    renderPage('/accept-invitation?token=legacy%2Btoken&source=email')

    expect(replaceStateSpy).toHaveBeenCalledWith(
      window.history.state,
      '',
      '/accept-invitation?source=email',
    )

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'long-enough-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'long-enough-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Set password' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'legacy+token' }),
      expect.any(Object),
    )
    expect(replaceStateSpy.mock.invocationCallOrder[0]).toBeLessThan(
      mutate.mock.invocationCallOrder[0],
    )
  })
})
