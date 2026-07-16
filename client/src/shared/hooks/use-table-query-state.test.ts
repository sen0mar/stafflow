import { getQueryNumber } from './use-table-query-state'

describe('getQueryNumber', () => {
  it.each([
    ['missing', null],
    ['zero', '0'],
    ['negative', '-1'],
    ['decimal', '2.5'],
    ['infinite', 'Infinity'],
    ['not a number', 'page-two'],
    ['unsafe', String(Number.MAX_SAFE_INTEGER + 1)],
  ])('uses the fallback for a %s page value', (_label, value) => {
    const searchParams = new URLSearchParams()

    if (value !== null) {
      searchParams.set('page', value)
    }

    expect(getQueryNumber(searchParams, 'page', 1)).toBe(1)
  })

  it('accepts a positive safe integer page', () => {
    expect(getQueryNumber(new URLSearchParams('page=42'), 'page', 1)).toBe(42)
  })
})
