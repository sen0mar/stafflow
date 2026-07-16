import { CalendarDays } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { EmptyState as SharedEmptyState } from '@/shared/components/layout/page-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { formatDateOnly } from '@/shared/lib/dates'
import type { LeaveRequest } from '../api/leave.api'
import { LeaveStatusBadge } from './leave-status-badge'

type NoteMode = 'reason' | 'review'

const getPreview = (value: string, maxLength = 72) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value

export const LeaveRequestsEmptyState = ({ text }: { text: string }) => (
  <SharedEmptyState
    icon={CalendarDays}
    title="No leave requests found"
    description={text}
  />
)

const LeaveNotePreview = ({
  label,
  value,
}: {
  label: string
  value: string | null
}) => {
  if (!value) {
    return <span className="text-sm text-muted">No note.</span>
  }

  return (
    <div className="flex max-w-[18rem] items-center gap-2">
      <span className="truncate text-sm text-muted">{getPreview(value)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-brand"
          >
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-fit min-w-56 max-w-[min(18rem,calc(100vw-2rem))] border-default bg-elevated p-3 shadow-card"
        >
          <p className="text-xs font-medium text-primary">{label}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted [overflow-wrap:anywhere]">
            {value}
          </p>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const LeaveRequestsTable = ({
  canReview,
  canCancel,
  noteMode,
  requests,
  onApprove,
  onCancel,
  onReject,
}: {
  canCancel?: boolean
  canReview?: boolean
  noteMode: NoteMode
  onApprove?: (request: LeaveRequest) => void
  onCancel?: (request: LeaveRequest) => void
  onReject?: (request: LeaveRequest) => void
  requests: LeaveRequest[]
}) => (
  <div className="rounded-2xl border border-default bg-surface p-2 shadow-soft">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>{noteMode === 'reason' ? 'Reason' : 'Review'}</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div>
                <p className="font-medium text-primary">
                  {request.employee.fullName}
                </p>
                <p className="text-xs text-muted">
                  {request.employee.department?.name ?? 'No department'}
                </p>
              </div>
            </TableCell>
            <TableCell>{request.leaveType.name}</TableCell>
            <TableCell>
              {formatDateOnly(request.startDate, 'MMM d, yyyy')} -{' '}
              {formatDateOnly(request.endDate, 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="max-w-[18rem] whitespace-normal">
              <LeaveNotePreview
                label={
                  noteMode === 'reason' ? 'Employee reason' : 'Review note'
                }
                value={
                  noteMode === 'reason' ? request.reason : request.reviewNote
                }
              />
            </TableCell>
            <TableCell>{request.totalDays}</TableCell>
            <TableCell>
              <LeaveStatusBadge status={request.status} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                {canReview &&
                ['PENDING', 'REJECTED', 'APPROVED'].includes(request.status) ? (
                  <>
                    {request.status !== 'APPROVED' ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onApprove?.(request)}
                      >
                        Approve
                      </Button>
                    ) : null}
                    {request.status !== 'REJECTED' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onReject?.(request)}
                      >
                        Reject
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {canCancel && request.status === 'PENDING' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onCancel?.(request)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
