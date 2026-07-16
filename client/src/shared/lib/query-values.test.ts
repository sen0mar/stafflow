import {
  getAllowedQueryValue,
  getOptionalAllowedQueryValue,
} from './query-values'

describe('URL query filter validation', () => {
  const allowedValues = ['all', 'ACTIVE', 'INACTIVE'] as const

  it.each(['all', 'ACTIVE', 'INACTIVE'])(
    'returns the allowed value %s',
    (value) => {
      expect(getAllowedQueryValue(value, allowedValues, 'all')).toBe(value)
    },
  )

  it.each([
    ['an unknown union member', 'TERMINATED'],
    ['different casing', 'active'],
    ['surrounding whitespace', ' ACTIVE '],
    ['an empty value', ''],
    ['a hostile value', '<script>alert(1)</script>'],
  ])('uses the fallback for %s', (_label, value) => {
    expect(getAllowedQueryValue(value, allowedValues, 'all')).toBe('all')
  })

  it('returns undefined when no fallback is supplied', () => {
    expect(
      getOptionalAllowedQueryValue('invalid', allowedValues),
    ).toBeUndefined()
    expect(
      getOptionalAllowedQueryValue(undefined, allowedValues),
    ).toBeUndefined()
  })
})
