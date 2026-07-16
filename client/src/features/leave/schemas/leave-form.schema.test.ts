import { leaveRequestFormSchema } from './leave-form.schema'

const parseRange = (startDate: string, endDate: string) =>
  leaveRequestFormSchema.safeParse({
    endDate,
    leaveTypeId: 'leave-type-1',
    reason: '',
    startDate,
  })

describe('leave request form schema', () => {
  it('accepts the maximum 365-day inclusive calendar span', () => {
    expect(parseRange('2025-01-01', '2025-12-31').success).toBe(true)
  })

  it('rejects a cross-year range', () => {
    const result = parseRange('2026-12-31', '2027-01-01')

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      'Leave requests must stay within one calendar year.',
    )
  })

  it('rejects one day over the maximum span', () => {
    const result = parseRange('2024-01-01', '2024-12-31')

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      'Leave requests cannot exceed 365 calendar days.',
    )
  })
})
