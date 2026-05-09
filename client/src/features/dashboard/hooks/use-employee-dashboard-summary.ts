import { useQuery } from '@tanstack/react-query'
import { getEmployeeDashboardSummary } from '../api/dashboard.api'
import { dashboardKeys } from '../api/dashboard.keys'

export const useEmployeeDashboardSummary = (enabled = true) =>
  useQuery({
    enabled,
    queryFn: getEmployeeDashboardSummary,
    queryKey: dashboardKeys.employeeSummary(),
  })
