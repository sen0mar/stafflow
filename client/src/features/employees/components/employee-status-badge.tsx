import { Badge } from '@/shared/components/ui/badge'
import type { AccountStatus, EmployeeStatus } from '../api/employees.api'

interface EmployeeStatusBadgeProps {
  status: AccountStatus | EmployeeStatus
  type?: 'account' | 'employee'
}

const statusLabels: Record<AccountStatus | EmployeeStatus, string> = {
  ACTIVE: 'Active',
  DISABLED: 'Disabled',
  INACTIVE: 'Inactive',
  INVITED: 'Invited',
  TERMINATED: 'Terminated',
}

export const EmployeeStatusBadge = ({
  status,
  type = 'employee',
}: EmployeeStatusBadgeProps) => {
  const variant = status === 'ACTIVE' ? 'secondary' : status === 'INVITED' ? 'outline' : 'destructive'

  return (
    <Badge variant={variant}>
      {type === 'account' ? 'Account: ' : ''}
      {statusLabels[status]}
    </Badge>
  )
}
