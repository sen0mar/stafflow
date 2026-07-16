import { TableSkeleton } from '@/shared/components/layout/page-state'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { AdminLeaveRequests } from '../components/admin-leave-requests'
import { EmployeeLeaveRequests } from '../components/employee-leave-requests'

export const LeaveRequestsPage = () => {
  const currentUserQuery = useCurrentUser()

  if (currentUserQuery.isLoading) {
    return <TableSkeleton />
  }

  if (currentUserQuery.data?.role === 'ADMIN') {
    return <AdminLeaveRequests />
  }

  return <EmployeeLeaveRequests />
}
