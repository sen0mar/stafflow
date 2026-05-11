import type { EmployeeListParams } from './employees.api'

export const employeesKeys = {
  all: () => ['employees'] as const,
  detail: (id: string) => [...employeesKeys.details(), id] as const,
  details: () => [...employeesKeys.all(), 'detail'] as const,
  list: (params: EmployeeListParams) => [...employeesKeys.lists(), params] as const,
  lists: () => [...employeesKeys.all(), 'list'] as const,
  self: () => [...employeesKeys.all(), 'self'] as const,
}
