import {
  differenceFromTodayInCalendarDays,
  formatDateOnly,
  getDateOnlyParts,
  parseDateOnly,
} from './dates'

describe('date-only client helpers', () => {
  it.each([['UTC-08 browser'], ['UTC browser'], ['UTC+14 browser']])(
    'renders the same calendar date for a %s',
    () => {
      expect(formatDateOnly('2026-07-16', 'MMM d, yyyy')).toBe('Jul 16, 2026')
      expect(getDateOnlyParts('2026-07-16')).toEqual({
        day: 16,
        month: 7,
        year: 2026,
      })
      expect(parseDateOnly('2026-07-16').toISOString()).toBe(
        '2026-07-16T00:00:00.000Z',
      )
    },
  )

  it.each([
    ['spring DST transition', '2026-03-08'],
    ['fall DST transition', '2026-11-01'],
  ])('does not shift the %s date', (_label, value) => {
    expect(formatDateOnly(value, 'yyyy-MM-dd')).toBe(value)
  })

  it('compares date-only values to local today through calendar components', () => {
    expect(
      differenceFromTodayInCalendarDays(
        '2026-07-18',
        new Date(2026, 6, 16, 23, 59),
      ),
    ).toBe(2)
  })
})
