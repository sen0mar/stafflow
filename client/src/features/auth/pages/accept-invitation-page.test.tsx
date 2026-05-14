import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { toast } from 'sonner'

import { AcceptInvitationPage } from './accept-invitation-page'
import { useAcceptInvitation } from '../hooks/use-accept-invitation'

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

const asAcceptInvitationResult = (value: unknown) =>
  value as ReturnType<typeof useAcceptInvitation>

const renderPage = (path = '/accept-invitation?token=invite-token') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AcceptInvitationPage />
    </MemoryRouter>,
  )

describe('AcceptInvitationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAcceptInvitation).mockReturnValue(
      asAcceptInvitationResult({
        isPending: false,
        mutate,
      }),
    )
  })

  it('shows an invalid invitation state when the token is missing', () => {
    renderPage('/accept-invitation')

    expect(screen.getByText('Invalid invitation link')).toBeInTheDocument()
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

  it('accepts the invitation with the token and password', () => {
    renderPage('/accept-invitation?token=invite-token%2Bencoded')

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
  })
})
