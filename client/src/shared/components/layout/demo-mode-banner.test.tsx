import { render, screen } from '@testing-library/react'
import { DemoModeBanner } from './demo-mode-banner'

describe('DemoModeBanner', () => {
  it('clearly identifies the public workspace as read-only', () => {
    render(<DemoModeBanner />)

    expect(screen.getByRole('status')).toHaveTextContent('Public demo:')
    expect(screen.getByRole('status')).toHaveTextContent(
      'this workspace is read-only',
    )
  })
})
