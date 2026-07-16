import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { AdminDashboard } from '../components/admin-dashboard'
import { DashboardLoading } from '../components/dashboard-query-state'
import { EmployeeDashboard } from '../components/employee-dashboard'

export const DashboardPage = () => {
  const currentUserQuery = useCurrentUser()

  if (currentUserQuery.isLoading) {
    return <DashboardLoading />
  }

  return currentUserQuery.data?.role === 'ADMIN' ? (
    <AdminDashboard />
  ) : (
    <EmployeeDashboard />
  )
}
