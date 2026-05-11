import { CalendarDays, Filter, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { useEmployees } from '@/features/employees/hooks/use-employees'
import type { LeaveRequest, LeaveRequestStatus, LeaveType } from '../api/leave.api'
import { LeaveRequestForm } from '../components/leave-request-form'
import { LeaveReviewDialog } from '../components/leave-review-dialog'
import { LeaveStatusBadge } from '../components/leave-status-badge'
import { LeaveTypeFormDialog } from '../components/leave-type-form-dialog'
import {
  useApproveLeaveRequest,
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useCreateLeaveType,
  useDeleteLeaveType,
  useLeaveRequests,
  useLeaveTypes,
  useRejectLeaveRequest,
  useSelfLeaveRequests,
  useUpdateLeaveType,
} from '../hooks/use-leave'
import type {
  LeaveRequestFormValues,
  LeaveReviewValues,
  LeaveTypeFormValues,
} from '../schemas/leave-form.schema'

const pageSize = 10

type StatusFilter = 'all' | LeaveRequestStatus
type NoteMode = 'reason' | 'review'

const getStatusFilter = (status: StatusFilter) => (status === 'all' ? undefined : status)
const getVisibleRequests = (requests: LeaveRequest[]) =>
  requests.filter((request) => request.status !== 'CANCELLED')

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value))

const getRequestPayload = (values: LeaveRequestFormValues) => ({
  endDate: values.endDate,
  leaveTypeId: values.leaveTypeId,
  reason: values.reason?.trim() ? values.reason.trim() : null,
  startDate: values.startDate,
})

const getLeaveTypePayload = (values: LeaveTypeFormValues) => ({
  annualAllowance: Number(values.annualAllowance),
  description: values.description?.trim() ? values.description.trim() : null,
  isActive: values.isActive,
  isPaid: values.isPaid,
  name: values.name.trim(),
})

const getPreview = (value: string, maxLength = 72) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value

const LoadingTable = () => (
  <div className="space-y-3 rounded-2xl border border-default bg-surface p-4 shadow-soft">
    {Array.from({ length: 6 }, (_item, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
)

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-default bg-surface px-6 py-12 text-center shadow-soft">
    <CalendarDays className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
    <h2 className="mt-4 text-lg font-semibold text-primary">No leave records found</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{text}</p>
  </div>
)

const PaginationControls = ({
  label,
  page,
  pageCount,
  total,
  onPageChange,
}: {
  label: string
  onPageChange: (page: number) => void
  page: number
  pageCount: number
  total: number
}) => (
  <div className="flex flex-col gap-3 border-t border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm text-muted">
      Page {page} of {pageCount} · {total} {label}
    </p>
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
        Previous
      </Button>
      <Button type="button" variant="outline" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  </div>
)

const LeaveNotePreview = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) {
    return <span className="text-sm text-muted">No note.</span>
  }

  return (
    <div className="flex max-w-[18rem] items-center gap-2">
      <span className="truncate text-sm text-muted">{getPreview(value)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-brand">
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

const LeaveRequestsTable = ({
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
                <p className="font-medium text-primary">{request.employee.fullName}</p>
                <p className="text-xs text-muted">{request.employee.department?.name ?? 'No department'}</p>
              </div>
            </TableCell>
            <TableCell>{request.leaveType.name}</TableCell>
            <TableCell>
              {formatDate(request.startDate)} - {formatDate(request.endDate)}
            </TableCell>
            <TableCell className="max-w-[18rem] whitespace-normal">
              <LeaveNotePreview
                label={noteMode === 'reason' ? 'Employee reason' : 'Review note'}
                value={noteMode === 'reason' ? request.reason : request.reviewNote}
              />
            </TableCell>
            <TableCell>{request.totalDays}</TableCell>
            <TableCell>
              <LeaveStatusBadge status={request.status} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                {canReview && ['PENDING', 'REJECTED', 'APPROVED'].includes(request.status) ? (
                  <>
                    {request.status !== 'APPROVED' ? (
                      <Button type="button" size="sm" onClick={() => onApprove?.(request)}>
                        Approve
                      </Button>
                    ) : null}
                    {request.status !== 'REJECTED' ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => onReject?.(request)}>
                        Reject
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {canCancel && request.status === 'PENDING' ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onCancel?.(request)}>
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

const EmployeeLeavePage = () => {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<StatusFilter>('all')
  const selfRequestsQuery = useSelfLeaveRequests({
    limit: pageSize,
    page,
    status: getStatusFilter(status),
  })
  const leaveTypesQuery = useLeaveTypes({ isActive: true, limit: 100, page: 1 })
  const createRequest = useCreateLeaveRequest()
  const cancelRequest = useCancelLeaveRequest()
  const requests = getVisibleRequests(selfRequestsQuery.data?.items ?? [])
  const balances = selfRequestsQuery.data?.balances ?? []
  const pagination = selfRequestsQuery.data?.pagination

  const handleSubmit = (values: LeaveRequestFormValues) => {
    createRequest.mutate(getRequestPayload(values))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Self-service"
        title="Leave Requests"
        description="Submit time off requests and track approval status."
      />

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div>
          <h2 className="text-lg font-semibold text-primary">Request leave</h2>
          <p className="mt-1 text-sm text-muted">Choose a leave type and date range.</p>
        </div>
        <LeaveRequestForm
          isSubmitting={createRequest.isPending}
          leaveTypes={leaveTypesQuery.data?.items ?? []}
          onSubmit={handleSubmit}
        />
      </section>

      {balances.length > 0 ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {balances.map((balance) => (
            <div key={balance.id} className="rounded-2xl border border-default bg-surface p-4 shadow-soft">
              <p className="text-sm font-medium text-primary">{balance.leaveType.name}</p>
              <p className="mt-2 text-2xl font-semibold text-primary">{balance.remaining}</p>
              <p className="mt-1 text-xs text-muted">
                {balance.used} used of {balance.allocated} days
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">My requests</h2>
            <p className="mt-1 text-sm text-muted">Recent leave request activity.</p>
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selfRequestsQuery.isLoading ? <LoadingTable /> : null}
        {selfRequestsQuery.isError ? (
          <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
            Leave requests could not be loaded. Refresh the page or try again later.
          </div>
        ) : null}
        {selfRequestsQuery.data && requests.length === 0 ? <EmptyState text="Your submitted leave requests will appear here." /> : null}
        {requests.length > 0 ? (
          <>
            <LeaveRequestsTable
              canCancel
              noteMode="review"
              requests={requests}
              onCancel={(request) => cancelRequest.mutate(request.id)}
            />
            <PaginationControls
              label="requests"
              page={pagination?.page ?? page}
              pageCount={pagination?.pageCount ?? 1}
              total={pagination?.total ?? 0}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>
    </div>
  )
}

const LeaveTypeManagement = () => {
  const [formOpen, setFormOpen] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const leaveTypesQuery = useLeaveTypes({ limit: 100, page: 1 })
  const createLeaveType = useCreateLeaveType()
  const updateLeaveType = useUpdateLeaveType()
  const deleteLeaveType = useDeleteLeaveType()
  const leaveTypes = leaveTypesQuery.data?.items ?? []

  const openCreate = () => {
    setEditingLeaveType(null)
    setFormOpen(true)
  }

  const handleSubmit = (values: LeaveTypeFormValues) => {
    const payload = getLeaveTypePayload(values)

    if (editingLeaveType) {
      updateLeaveType.mutate(
        { id: editingLeaveType.id, ...payload },
        {
          onSuccess: () => {
            setEditingLeaveType(null)
            setFormOpen(false)
          },
        },
      )
      return
    }

    createLeaveType.mutate(payload, {
      onSuccess: () => setFormOpen(false),
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Leave types</h2>
          <p className="mt-1 text-sm text-muted">Manage request categories and allowances.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create type
        </Button>
      </div>
      {leaveTypesQuery.isLoading ? <LoadingTable /> : null}
      {leaveTypes.length > 0 ? (
        <div className="rounded-2xl border border-default bg-surface p-2 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Allowance</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-primary">{leaveType.name}</p>
                      <p className="text-xs text-muted">{leaveType.description ?? 'No description'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{leaveType.annualAllowance ?? 0} days</TableCell>
                  <TableCell>{leaveType.isPaid ? 'Paid' : 'Unpaid'}</TableCell>
                  <TableCell>{leaveType.isActive ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingLeaveType(leaveType)
                          setFormOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => deleteLeaveType.mutate(leaveType.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <LeaveTypeFormDialog
        isSubmitting={createLeaveType.isPending || updateLeaveType.isPending}
        leaveType={editingLeaveType}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
    </section>
  )
}

const AdminLeavePage = () => {
  const [page, setPage] = useState(1)
  const [employeeId, setEmployeeId] = useState('all')
  const [leaveTypeId, setLeaveTypeId] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)
  const [reviewRequest, setReviewRequest] = useState<LeaveRequest | null>(null)
  const leaveRequestsQuery = useLeaveRequests({
    employeeId: employeeId === 'all' ? undefined : employeeId,
    leaveTypeId: leaveTypeId === 'all' ? undefined : leaveTypeId,
    limit: pageSize,
    page,
    status: getStatusFilter(status),
  })
  const leaveTypesQuery = useLeaveTypes({ limit: 100, page: 1 })
  const employeesQuery = useEmployees({
    limit: 100,
    page: 1,
    sort: 'name',
    status: 'ACTIVE',
  })
  const approveRequest = useApproveLeaveRequest()
  const rejectRequest = useRejectLeaveRequest()
  const requests = getVisibleRequests(leaveRequestsQuery.data?.items ?? [])
  const pagination = leaveRequestsQuery.data?.pagination

  const resetPage = () => setPage(1)
  const openReview = (action: 'approve' | 'reject', request: LeaveRequest) => {
    setReviewAction(action)
    setReviewRequest(request)
  }

  const handleReviewSubmit = (values: LeaveReviewValues) => {
    if (!reviewRequest || !reviewAction) {
      return
    }

    const payload = {
      id: reviewRequest.id,
      reviewNote: values.reviewNote?.trim() ? values.reviewNote.trim() : null,
    }
    const options = {
      onSuccess: () => {
        setReviewAction(null)
        setReviewRequest(null)
      },
    }

    if (reviewAction === 'approve') {
      approveRequest.mutate(payload, options)
      return
    }

    rejectRequest.mutate(payload, options)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Leave Requests"
        description="Review employee leave requests, manage leave types, and keep balances simple."
      />

      <section className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr]">
          <Select
            value={employeeId}
            onValueChange={(value) => {
              setEmployeeId(value)
              resetPage()
            }}
          >
            <SelectTrigger className="w-full">
              <Search className="h-4 w-4 text-muted" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employeesQuery.data?.items.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={leaveTypeId}
            onValueChange={(value) => {
              setLeaveTypeId(value)
              resetPage()
            }}
          >
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 text-muted" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All leave types</SelectItem>
              {leaveTypesQuery.data?.items.map((leaveType) => (
                <SelectItem key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter)
              resetPage()
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {leaveRequestsQuery.isLoading ? <LoadingTable /> : null}
        {leaveRequestsQuery.isError ? (
          <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
            Leave requests could not be loaded. Refresh the page or try again later.
          </div>
        ) : null}
        {leaveRequestsQuery.data && requests.length === 0 ? <EmptyState text="Adjust filters or wait for employees to submit requests." /> : null}
        {requests.length > 0 ? (
          <>
            <LeaveRequestsTable
              canReview
              noteMode="reason"
              requests={requests}
              onApprove={(request) => openReview('approve', request)}
              onReject={(request) => openReview('reject', request)}
            />
            <PaginationControls
              label="requests"
              page={pagination?.page ?? page}
              pageCount={pagination?.pageCount ?? 1}
              total={pagination?.total ?? 0}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </section>

      <LeaveTypeManagement />

      <LeaveReviewDialog
        action={reviewAction}
        isSubmitting={approveRequest.isPending || rejectRequest.isPending}
        open={Boolean(reviewAction)}
        request={reviewRequest}
        onOpenChange={(open) => {
          if (!open) {
            setReviewAction(null)
            setReviewRequest(null)
          }
        }}
        onSubmit={handleReviewSubmit}
      />
    </div>
  )
}

export const LeaveRequestsPage = () => {
  const currentUserQuery = useCurrentUser()

  if (currentUserQuery.isLoading) {
    return <LoadingTable />
  }

  if (currentUserQuery.data?.role === 'ADMIN') {
    return <AdminLeavePage />
  }

  return <EmployeeLeavePage />
}
