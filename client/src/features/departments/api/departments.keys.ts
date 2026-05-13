import type { DepartmentListParams } from './departments.api'

export const departmentsKeys = {
  all: () => ['departments'] as const,
  detail: (id: string) => [...departmentsKeys.details(), id] as const,
  details: () => [...departmentsKeys.all(), 'detail'] as const,
  list: (params: DepartmentListParams) =>
    [...departmentsKeys.lists(), params] as const,
  lists: () => [...departmentsKeys.all(), 'list'] as const,
}
