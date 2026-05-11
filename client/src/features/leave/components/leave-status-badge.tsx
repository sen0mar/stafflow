import { Badge } from '@/shared/components/ui/badge'
import type { LeaveRequestStatus } from '../api/leave.api'

const statusConfig = {
  APPROVED: {
    className: 'border-[color:var(--state-success)]/30 bg-[color:var(--state-success)]/15 [color:var(--state-success)]',
    label: 'Approved',
  },
  CANCELLED: {
    className: 'border-default bg-subtle text-muted',
    label: 'Cancelled',
  },
  PENDING: {
    className: 'border-[color:var(--state-warning)]/30 bg-[color:var(--state-warning)]/15 [color:var(--state-warning)]',
    label: 'Pending',
  },
  REJECTED: {
    className: 'border-[color:var(--state-error)]/30 bg-[color:var(--state-error)]/15 [color:var(--state-error)]',
    label: 'Rejected',
  },
} satisfies Record<LeaveRequestStatus, { className: string; label: string }>

export const LeaveStatusBadge = ({ status }: { status: LeaveRequestStatus }) => (
  <Badge variant="outline" className={statusConfig[status].className}>
    {statusConfig[status].label}
  </Badge>
)
