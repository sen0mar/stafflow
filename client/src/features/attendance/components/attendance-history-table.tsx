import { Edit3 } from 'lucide-react'
import {
  DataTable,
  type DataTableColumn,
} from '@/shared/components/data-table/data-table'
import { Button } from '@/shared/components/ui/button'
import { formatDate, formatDateOnly } from '@/shared/lib/dates'
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
}: AttendanceHistoryTableProps) => {
  const columns: DataTableColumn<AttendanceRecord>[] = [
    ...(isAdmin
      ? [
          {
            header: 'Employee',
            id: 'employee',
            render: (record: AttendanceRecord) => (
              <div>
                <p className="font-medium text-primary">
                  {record.employee.fullName}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {record.employee.employeeCode} ·{' '}
                  {record.employee.department?.name ?? 'Unassigned'}
                </p>
              </div>
            ),
          },
        ]
      : []),
    {
      className: 'font-medium text-primary',
      header: 'Date',
      id: 'date',
      render: (record) => formatDateOnly(record.date, 'MMM d, yyyy'),
    },
    {
      header: 'Clock In',
      id: 'clockIn',
      render: (record) =>
        record.clockInAt ? formatDate(record.clockInAt, 'p') : 'Not recorded',
    },
    {
      header: 'Clock Out',
      id: 'clockOut',
      render: (record) =>
        record.clockOutAt ? formatDate(record.clockOutAt, 'p') : 'Not recorded',
    },
    {
      header: 'Total',
      id: 'total',
      render: (record) => formatMinutes(record.totalMinutes),
    },
    {
      header: 'Status',
      id: 'status',
      render: (record) => <AttendanceStatusBadge status={record.status} />,
    },
    {
      header: 'Source',
      id: 'source',
      render: (record) => record.source,
    },
    ...(isAdmin
      ? [
          {
            className: 'w-12',
            header: <span className="sr-only">Actions</span>,
            id: 'actions',
            render: (record: AttendanceRecord) => (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Correct attendance for ${record.employee.fullName}`}
                onClick={() => onCorrect?.(record)}
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      getRowKey={(record) => record.id}
      items={records}
    />
  )
}
