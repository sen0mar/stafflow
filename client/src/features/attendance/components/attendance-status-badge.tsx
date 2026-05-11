import { Badge } from '@/shared/components/ui/badge'
import type { AttendanceStatus } from '../api/attendance.api'
import { attendanceStatusLabel } from './attendance-formatters'

const statusClassName: Record<AttendanceStatus, string> = {
  ABSENT: 'border-default bg-subtle text-muted',
  LATE: 'border-default bg-brand-soft text-brand-text',
  PARTIAL: 'border-default bg-inset text-secondary',
  PRESENT: 'border-default bg-brand-soft text-brand-text',
}

export const AttendanceStatusBadge = ({ status }: { status: AttendanceStatus }) => (
  <Badge className={statusClassName[status]} variant="outline">
    {attendanceStatusLabel(status)}
  </Badge>
)
