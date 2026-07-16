import { fireEvent, render, screen } from '@testing-library/react'
import { ClockInOutCard } from './clock-in-out-card'

const defaultProps = {
  isClockingIn: false,
  isClockingOut: false,
  isLoading: false,
  onClockIn: vi.fn(),
  onClockOut: vi.fn(),
  today: null,
}

describe('ClockInOutCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disables employee attendance mutations in read-only mode', () => {
    render(<ClockInOutCard {...defaultProps} readOnly />)

    const clockIn = screen.getByRole('button', { name: 'Clock in' })
    const clockOut = screen.getByRole('button', { name: 'Clock out' })

    expect(clockIn).toBeDisabled()
    expect(clockOut).toBeDisabled()
    fireEvent.click(clockIn)
    expect(defaultProps.onClockIn).not.toHaveBeenCalled()
  })
})
