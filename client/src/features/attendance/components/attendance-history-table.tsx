import { Edit3 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { formatDate } from '@/shared/lib/dates'
import type { AttendanceRecord } from '../api/attendance.api'
import { AttendanceStatusBadge } from './attendance-status-badge'
import { formatMinutes } from './attendance-formatters'

interface AttendanceHistoryTableProps {
  isAdmin?: boolean
  onCorrect?: (record: AttendanceRecord) => void
  records: AttendanceRecord[]
}

export const AttendanceHistoryTable = ({
  isAdmin = false,
  onCorrect,
  records,
}: AttendanceHistoryTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        {isAdmin ? <TableHead>Employee</TableHead> : null}
        <TableHead>Date</TableHead>
        <TableHead>Clock In</TableHead>
        <TableHead>Clock Out</TableHead>
        <TableHead>Total</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Source</TableHead>
        {isAdmin ? <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead> : null}
      </TableRow>
    </TableHeader>
    <TableBody>
      {records.map((record) => (
        <TableRow key={record.id}>
          {isAdmin ? (
            <TableCell>
              <p className="font-medium text-primary">{record.employee.fullName}</p>
              <p className="mt-1 text-xs text-muted">
                {record.employee.employeeCode} · {record.employee.department?.name ?? 'Unassigned'}
              </p>
            </TableCell>
          ) : null}
          <TableCell className="font-medium text-primary">{formatDate(record.date, 'MMM d, yyyy')}</TableCell>
          <TableCell>{record.clockInAt ? formatDate(record.clockInAt, 'p') : 'Not recorded'}</TableCell>
          <TableCell>{record.clockOutAt ? formatDate(record.clockOutAt, 'p') : 'Not recorded'}</TableCell>
          <TableCell>{formatMinutes(record.totalMinutes)}</TableCell>
          <TableCell><AttendanceStatusBadge status={record.status} /></TableCell>
          <TableCell>{record.source}</TableCell>
          {isAdmin ? (
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Correct attendance for ${record.employee.fullName}`}
                onClick={() => onCorrect?.(record)}
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TableCell>
          ) : null}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
