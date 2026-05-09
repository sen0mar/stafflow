import { useQuery } from '@tanstack/react-query'
import { getAdminDashboardSummary } from '../api/dashboard.api'
import { dashboardKeys } from '../api/dashboard.keys'

export const useAdminDashboardSummary = (enabled = true) =>
  useQuery({
    enabled,
    queryFn: getAdminDashboardSummary,
    queryKey: dashboardKeys.adminSummary(),
  })
