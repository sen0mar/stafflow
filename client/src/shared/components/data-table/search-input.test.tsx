import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { SearchInput } from './search-input'
import { useTableQueryState } from '@/shared/hooks/use-table-query-state'

const HistorySearchHarness = () => {
  const navigate = useNavigate()
  const tableState = useTableQueryState()
  const search = tableState.getString('search')

  return (
    <>
      <SearchInput
        debounceMs={0}
        placeholder="Search employees"
        value={search}
        onDebouncedChange={(value) =>
          tableState.updateQuery({ search: value }, { resetPage: true })
        }
      />
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Forward
      </button>
    </>
  )
}

describe('SearchInput', () => {
  it('synchronizes its draft when an external filter reset changes the value', () => {
    const onDebouncedChange = vi.fn()
    const { rerender } = render(
      <SearchInput
        placeholder="Search employees"
        value="Maya"
        onDebouncedChange={onDebouncedChange}
      />,
    )

    rerender(
      <SearchInput
        placeholder="Search employees"
        value=""
        onDebouncedChange={onDebouncedChange}
      />,
    )

    expect(
      screen.getByRole('textbox', { name: 'Search employees' }),
    ).toHaveValue('')
    expect(onDebouncedChange).not.toHaveBeenCalled()
  })

  it('tracks URL search values across browser back and forward navigation', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={['/employees?search=first', '/employees?search=second']}
        initialIndex={1}
      >
        <HistorySearchHarness />
      </MemoryRouter>,
    )

    const input = screen.getByRole('textbox', { name: 'Search employees' })
    expect(input).toHaveValue('second')

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(input).toHaveValue('first')

    await user.click(screen.getByRole('button', { name: 'Forward' }))
    expect(input).toHaveValue('second')
  })
})
