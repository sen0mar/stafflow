import type { PayslipListParams, SelfPayslipListParams } from './payslips.api'

export const payslipsKeys = {
  all: () => ['payslips'] as const,
  detail: (id: string) => [...payslipsKeys.details(), id] as const,
  details: () => [...payslipsKeys.all(), 'detail'] as const,
  list: (params: PayslipListParams) =>
    [...payslipsKeys.lists(), params] as const,
  lists: () => [...payslipsKeys.all(), 'list'] as const,
  selfList: (params: SelfPayslipListParams) =>
    [...payslipsKeys.selfLists(), params] as const,
  selfLists: () => [...payslipsKeys.all(), 'self'] as const,
}
